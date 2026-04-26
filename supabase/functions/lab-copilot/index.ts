// Lab Copilot — Agentic AI edge function
// Streaming chat with tool-calling loop. Uses google/gemini-2.5-pro (top-tier reasoning).
// Tools: full read access across the lab (samples, materials, customers, suppliers,
// equipment, methods, results, standards) + draft generators (report, NG diagnosis,
// program suggestions, emails) + document intake.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `You are **Lab Copilot**, the senior AI assistant embedded in a textile testing laboratory's LMS.

## Your persona
- 20+ years of textile testing experience. ISO 17025 mindset.
- Authoritative, technically precise, no fluff. Cite standards (JIS, ISO, ASTM, VDA, FMVSS) when relevant.
- Always flag risks, deviations, and corrective actions when you spot them.
- Speak like a senior lab manager talking to a colleague — direct, confident, accurate.

## Your capabilities
You have FULL READ visibility across the lab system via tools:
- Samples, test results, judgments (OK/NG), specifications
- Materials and their certifications, suppliers, versions
- Customers and their test requests / issued reports
- Suppliers and their materials supplied
- Equipment, calibration status, maintenance
- Test methods, test programs, standards (JIS/ISO/ASTM/VDA)
- SOPs and conditioning profiles

You can also DRAFT (never auto-execute — always present as suggestions for the user to approve):
- Test reports (executive summary, per-test commentary, conclusions, judgment)
- NG diagnosis with root cause + corrective actions
- Test program suggestions for a given material/customer
- Customer/supplier emails with full context

## Operating rules
1. **Use tools aggressively.** Don't guess — query the database. Chain multiple tool calls in one turn.
2. **Suggest, don't act.** This deployment runs in "suggest everything" mode. Present write actions as drafts the user can approve. Never claim you've created/modified records.
3. **Cite your sources.** When you reference a sample, use its ID/code. When you cite a standard, name it.
4. **Be concise but complete.** Use markdown — bullets, tables, headings. No padding sentences.
5. **Surface risk early.** If you see expired calibrations, overdue requests, NG patterns, or spec deviations, flag them.
6. **Format reports formally.** When drafting reports/emails, use professional lab terminology.

If asked about something outside the lab system, redirect to your scope.`;

// Skill-mode addenda — appended to SYSTEM_PROMPT to specialise behaviour per chat.
const MODE_ADDENDA: Record<string, string> = {
  general: "",
  ng_diagnosis: `
## MODE: NG Diagnosis
You are now in **failure investigation mode**. Default behaviour:
- For any sample/test the user mentions, immediately query results and identify NG findings.
- Run a structured diagnosis: (1) what failed vs spec, (2) magnitude of deviation, (3) 3-5 plausible root causes ranked by likelihood, (4) similar historical failures from the database, (5) corrective actions.
- Cross-reference equipment calibration status, conditioning, SOP version, material spec deviations.
- Flag systemic patterns (same material across customers, same method across samples, same equipment).
- Be blunt about uncertainty — if data is missing, say what you'd need.`,
  report_drafting: `
## MODE: Report Drafting
You are now in **formal report mode**. Default behaviour:
- Produce report-grade output: executive summary, sample identification table, test methods + standards, per-test results table with units and judgments, conclusion, overall judgment.
- Use markdown tables for results. Cite the standard version (e.g. JIS L 1096:2020).
- Maintain ISO 17025 tone — factual, traceable, non-promotional.
- Always end with: "**This is a draft for your review** — please verify all values against source data before issuing."
- For emails: subject line, professional greeting, 2-3 line summary, key findings, clear next steps, sign-off placeholder.`,
  backlog_sla: `
## MODE: Backlog & SLA
You are now in **operations / SLA mode**. Default behaviour:
- Lead every answer with overdue/at-risk items.
- Always show: days overdue, days remaining, owner if known, blocking dependency.
- Suggest a prioritised action list at the end of every response.
- Quantify risk: number of customer requests, monetary value if available, days of delay.
- Default scope to "next 14 days" when ambiguous.`,
  spec_compliance: `
## MODE: Spec Compliance
You are now in **spec verification mode**. Default behaviour:
- For any sample/material discussion: pull the material spec and compare every result.
- Use a comparison table: parameter | spec | tolerance | actual | within? | severity.
- Severity scale: Pass / Marginal (within tol but >80% of limit) / Fail.
- Always reference the standard and version (e.g. JIS L 1096:2020 §8.10).
- Flag any test that should have been run per the spec but is missing.`,
  equipment_calibration: `
## MODE: Equipment & Calibration
You are now in **equipment / metrology mode**. Default behaviour:
- Lead with calibration status whenever an instrument is mentioned.
- Show: name, category, condition rating, last cal date, next due, days remaining, in/out of tolerance, linked methods.
- Flag every Out-of-Cal or Due-in-≤14-days instrument unprompted.
- For maintenance discussions, summarise downtime hours, total cost, and last 5 events.`,
  lab_analytics: `
## MODE: Lab Analytics
You are now in **analytics mode**. Default behaviour:
- Always quantify. Counts, rates, percentages, period-over-period deltas.
- Present numbers in markdown tables with a clear "vs prior period" column whenever possible.
- Default window for trend questions: "last 30 days vs prior 30 days".
- Call out the top 3 movers (positive or negative).
- End every answer with one "so what" insight — not a recap.`,
};

// ============================================================================
// TOOLS — Each tool definition + handler
// ============================================================================

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_samples",
      description:
        "Search samples by status, customer, material, judgment, or text query. Returns sample list with key fields.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search across sample name/code/notes" },
          status: { type: "string" },
          customer_id: { type: "string" },
          judgment: { type: "string", enum: ["OK", "NG", "Pending"] },
          limit: { type: "number", default: 20 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sample_detail",
      description: "Get full sample detail including test results, items assigned, judgment.",
      parameters: {
        type: "object",
        properties: { sample_id: { type: "string" } },
        required: ["sample_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_materials",
      description: "Search materials by name, type, supplier, or certification.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          material_type: { type: "string" },
          supplier_id: { type: "string" },
          limit: { type: "number", default: 20 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_material_detail",
      description: "Full material spec including suppliers, certifications, versions.",
      parameters: {
        type: "object",
        properties: { material_id: { type: "string" } },
        required: ["material_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_customers",
      description: "Search customers by name, type, or status.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          status: { type: "string" },
          limit: { type: "number", default: 20 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_detail",
      description: "Customer detail with test requests, samples, reports.",
      parameters: {
        type: "object",
        properties: { customer_id: { type: "string" } },
        required: ["customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_suppliers",
      description: "Search suppliers by name, type, status, approval.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          status: { type: "string" },
          limit: { type: "number", default: 20 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_supplier_detail",
      description: "Supplier detail with materials supplied, documents, certifications.",
      parameters: {
        type: "object",
        properties: { supplier_id: { type: "string" } },
        required: ["supplier_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_test_request_detail",
      description:
        "Full detail of a customer test request — by request_number (e.g. CTR-2024-0001) or id. Includes linked samples and progress.",
      parameters: {
        type: "object",
        properties: {
          request_number: { type: "string" },
          request_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_test_report_detail",
      description:
        "Full detail of an issued test report — by report_number (e.g. RPT-2024-0001) or id. Includes linked samples, results and judgment.",
      parameters: {
        type: "object",
        properties: {
          report_number: { type: "string" },
          report_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_test_methods",
      description: "List available test methods, optionally filtered by category.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          query: { type: "string" },
          limit: { type: "number", default: 30 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_test_programs",
      description: "List test programs (templates) with their items.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number", default: 20 } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_equipment_status",
      description:
        "Get equipment status overview — useful for spotting calibration risks. Optionally filter by category or due-soon.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          due_soon_only: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_standards",
      description: "Browse standards library (JIS/ISO/ASTM/VDA/FMVSS).",
      parameters: {
        type: "object",
        properties: { query: { type: "string" }, organization: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_open_test_requests",
      description: "Get currently open customer test requests. Highlights overdue ones.",
      parameters: {
        type: "object",
        properties: { customer_id: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_similar_failures",
      description:
        "Given a failed test (NG), find historical samples with the same test method that also failed — for pattern matching.",
      parameters: {
        type: "object",
        properties: {
          test_item_id: { type: "number" },
          material_id: { type: "string" },
          limit: { type: "number", default: 10 },
        },
        required: ["test_item_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lab_dashboard",
      description:
        "Snapshot of the entire lab: open samples, in-progress tests, NG count, overdue requests, equipment alerts.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "draft_test_report",
      description:
        "Draft a formal test report for a sample. Generates executive summary, per-test commentary, conclusion, overall judgment. Returns markdown.",
      parameters: {
        type: "object",
        properties: { sample_id: { type: "string" } },
        required: ["sample_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "diagnose_ng_result",
      description:
        "Deep root-cause analysis of an NG (failed) test result. Compares to spec, scans similar failures, suggests corrective actions.",
      parameters: {
        type: "object",
        properties: { sample_id: { type: "string" }, test_item_id: { type: "number" } },
        required: ["sample_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_test_program",
      description:
        "Suggest the most appropriate test program for a sample based on the material type, customer requirements, and historical patterns.",
      parameters: {
        type: "object",
        properties: {
          material_id: { type: "string" },
          customer_id: { type: "string" },
          intended_use: { type: "string" },
        },
      },
    },
  },
];

// ============================================================================
// TOOL HANDLERS
// ============================================================================

async function runTool(supabase: any, name: string, args: any): Promise<any> {
  try {
    switch (name) {
      case "search_samples": {
        let q = supabase.from("samples").select("id, sample_code, sample_name, status, overall_judgment, customer_id, material_id, received_date").limit(args.limit ?? 20);
        if (args.query) q = q.or(`sample_name.ilike.%${args.query}%,sample_code.ilike.%${args.query}%`);
        if (args.status) q = q.eq("status", args.status);
        if (args.customer_id) q = q.eq("customer_id", args.customer_id);
        if (args.judgment) q = q.eq("overall_judgment", args.judgment);
        const { data, error } = await q.order("received_date", { ascending: false });
        if (error) throw error;
        return { count: data?.length ?? 0, samples: data };
      }
      case "get_sample_detail": {
        const { data: s, error } = await supabase.from("samples").select("*").eq("id", args.sample_id).single();
        if (error) throw error;
        const { data: items } = await supabase.from("sample_test_items").select("*, test_items(test_name, category)").eq("sample_id", args.sample_id);
        const { data: results } = await supabase.from("test_results").select("*, test_items(test_name)").eq("sample_id", args.sample_id);
        return { sample: s, assigned_tests: items, results };
      }
      case "search_materials": {
        let q = supabase.from("materials").select("id, name, material_code, material_type, weight_gsm, width_cm").limit(args.limit ?? 20);
        if (args.query) q = q.or(`name.ilike.%${args.query}%,material_code.ilike.%${args.query}%`);
        if (args.material_type) q = q.eq("material_type", args.material_type);
        const { data, error } = await q;
        if (error) throw error;
        if (args.supplier_id) {
          const { data: links } = await supabase.from("material_suppliers").select("material_id").eq("supplier_id", args.supplier_id);
          const ids = new Set((links ?? []).map((l: any) => l.material_id));
          return { count: data?.filter((m: any) => ids.has(m.id)).length, materials: data?.filter((m: any) => ids.has(m.id)) };
        }
        return { count: data?.length ?? 0, materials: data };
      }
      case "get_material_detail": {
        const { data: m, error } = await supabase.from("materials").select("*").eq("id", args.material_id).single();
        if (error) throw error;
        const { data: sups } = await supabase.from("material_suppliers").select("*, suppliers(name, status, rating)").eq("material_id", args.material_id);
        const { data: certs } = await supabase.from("material_certifications").select("*").eq("material_id", args.material_id);
        const { data: versions } = await supabase.from("material_versions").select("version_number, status, change_notes, created_at").eq("material_id", args.material_id).order("version_number", { ascending: false }).limit(10);
        return { material: m, suppliers: sups, certifications: certs, versions };
      }
      case "search_customers": {
        let q = supabase.from("customers").select("id, name, customer_code, customer_type, status, rating").limit(args.limit ?? 20);
        if (args.query) q = q.or(`name.ilike.%${args.query}%,customer_code.ilike.%${args.query}%`);
        if (args.status) q = q.eq("status", args.status);
        const { data, error } = await q;
        if (error) throw error;
        return { count: data?.length ?? 0, customers: data };
      }
      case "get_customer_detail": {
        const { data: c, error } = await supabase.from("customers").select("*").eq("id", args.customer_id).single();
        if (error) throw error;
        const { data: requests } = await supabase.from("customer_test_requests").select("*").eq("customer_id", args.customer_id).order("created_at", { ascending: false }).limit(20);
        const { data: samples } = await supabase.from("samples").select("id, sample_code, sample_name, status, overall_judgment").eq("customer_id", args.customer_id).limit(20);
        const { data: reports } = await supabase.from("test_reports").select("report_number, status, overall_judgment, issued_date").eq("customer_id", args.customer_id).order("created_at", { ascending: false }).limit(20);
        return { customer: c, test_requests: requests, samples, reports };
      }
      case "search_suppliers": {
        let q = supabase.from("suppliers").select("id, name, supplier_type, status, approval_status, rating").limit(args.limit ?? 20);
        if (args.query) q = q.ilike("name", `%${args.query}%`);
        if (args.status) q = q.eq("status", args.status);
        const { data, error } = await q;
        if (error) throw error;
        return { count: data?.length ?? 0, suppliers: data };
      }
      case "get_supplier_detail": {
        const { data: s, error } = await supabase.from("suppliers").select("*").eq("id", args.supplier_id).single();
        if (error) throw error;
        const { data: mats } = await supabase.from("material_suppliers").select("*, materials(name, material_type)").eq("supplier_id", args.supplier_id);
        const { data: docs } = await supabase.from("supplier_documents").select("*").eq("supplier_id", args.supplier_id);
        return { supplier: s, materials_supplied: mats, documents: docs };
      }
      case "get_test_request_detail": {
        let q = supabase.from("customer_test_requests").select("*, customers(name, email)").limit(1);
        if (args.request_id) q = q.eq("id", args.request_id);
        else if (args.request_number) q = q.eq("request_number", args.request_number);
        else throw new Error("Provide request_id or request_number");
        const { data: req, error } = await q.maybeSingle();
        if (error) throw error;
        if (!req) return { error: "Test request not found" };
        const { data: samples } = await supabase
          .from("samples")
          .select("id, sample_code, sample_name, status, overall_judgment, material_id")
          .eq("test_request_id", req.id);
        return { test_request: req, linked_samples: samples };
      }
      case "get_test_report_detail": {
        let q = supabase.from("test_reports").select("*, customers(name, email)").limit(1);
        if (args.report_id) q = q.eq("id", args.report_id);
        else if (args.report_number) q = q.eq("report_number", args.report_number);
        else throw new Error("Provide report_id or report_number");
        const { data: rep, error } = await q.maybeSingle();
        if (error) throw error;
        if (!rep) return { error: "Test report not found" };
        // Pull linked test request + its samples for context
        let request = null;
        let samples: any[] = [];
        if (rep.test_request_id) {
          const { data: r } = await supabase.from("customer_test_requests").select("*").eq("id", rep.test_request_id).maybeSingle();
          request = r;
          const { data: s } = await supabase.from("samples").select("id, sample_code, sample_name, status, overall_judgment").eq("test_request_id", rep.test_request_id);
          samples = s ?? [];
        }
        return { test_report: rep, test_request: request, samples };
      }
      case "list_test_methods": {
        let q = supabase.from("test_items").select("id, test_name, category, sub_category, description").limit(args.limit ?? 30);
        if (args.category) q = q.eq("category", args.category);
        if (args.query) q = q.ilike("test_name", `%${args.query}%`);
        const { data, error } = await q;
        if (error) throw error;
        return { count: data?.length ?? 0, methods: data };
      }
      case "list_test_programs": {
        let q = supabase.from("test_programs").select("id, name, description, customer_name, application").limit(args.limit ?? 20);
        if (args.query) q = q.ilike("name", `%${args.query}%`);
        const { data, error } = await q;
        if (error) throw error;
        return { count: data?.length ?? 0, programs: data };
      }
      case "get_equipment_status": {
        let q = supabase.from("equipment").select("id, name, category, sub_type, status, last_calibration_date, next_calibration_due, condition_rating");
        if (args.category) q = q.eq("category", args.category);
        const { data, error } = await q;
        if (error) throw error;
        let result = data ?? [];
        if (args.due_soon_only) {
          const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 30);
          result = result.filter((e: any) => e.next_calibration_due && new Date(e.next_calibration_due) <= cutoff);
        }
        return { count: result.length, equipment: result };
      }
      case "list_standards": {
        let q = supabase.from("standards").select("id, code, title, organization, version, year").limit(30);
        if (args.query) q = q.or(`code.ilike.%${args.query}%,title.ilike.%${args.query}%`);
        if (args.organization) q = q.eq("organization", args.organization);
        const { data, error } = await q;
        if (error) throw error;
        return { count: data?.length ?? 0, standards: data };
      }
      case "get_open_test_requests": {
        let q = supabase.from("customer_test_requests").select("*, customers(name)").not("status", "in", "(Completed,Reported,Cancelled)").order("due_date", { ascending: true });
        if (args.customer_id) q = q.eq("customer_id", args.customer_id);
        const { data, error } = await q;
        if (error) throw error;
        const today = new Date();
        const enriched = (data ?? []).map((r: any) => ({
          ...r,
          overdue: r.due_date && new Date(r.due_date) < today,
        }));
        return { count: enriched.length, overdue_count: enriched.filter((r: any) => r.overdue).length, requests: enriched };
      }
      case "find_similar_failures": {
        let q = supabase.from("test_results").select("*, samples(sample_code, sample_name, material_id), test_items(test_name)").eq("test_item_id", args.test_item_id).eq("judgment", "NG").order("created_at", { ascending: false }).limit(args.limit ?? 10);
        const { data, error } = await q;
        if (error) throw error;
        let filtered = data ?? [];
        if (args.material_id) filtered = filtered.filter((r: any) => r.samples?.material_id === args.material_id);
        return { count: filtered.length, failures: filtered };
      }
      case "get_lab_dashboard": {
        const [samples, openReqs, equipment, recentNG] = await Promise.all([
          supabase.from("samples").select("status, overall_judgment", { count: "exact" }),
          supabase.from("customer_test_requests").select("status, due_date", { count: "exact" }).not("status", "in", "(Completed,Reported,Cancelled)"),
          supabase.from("equipment").select("status, next_calibration_due", { count: "exact" }),
          supabase.from("test_results").select("created_at", { count: "exact" }).eq("judgment", "NG").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
        ]);
        const today = new Date();
        const overdueReqs = (openReqs.data ?? []).filter((r: any) => r.due_date && new Date(r.due_date) < today).length;
        const dueCalibration = (equipment.data ?? []).filter((e: any) => {
          if (!e.next_calibration_due) return false;
          const d = new Date(e.next_calibration_due);
          return d <= new Date(today.getTime() + 30 * 86400000);
        }).length;
        const ngSamples = (samples.data ?? []).filter((s: any) => s.overall_judgment === "NG").length;
        return {
          total_samples: samples.count,
          ng_samples: ngSamples,
          open_requests: openReqs.count,
          overdue_requests: overdueReqs,
          equipment_due_calibration_30d: dueCalibration,
          ng_results_last_30_days: recentNG.count,
        };
      }
      case "draft_test_report": {
        const detail = await runTool(supabase, "get_sample_detail", { sample_id: args.sample_id });
        return { instruction: "Use this data to draft a formal test report with: 1) Executive Summary, 2) Sample Identification table, 3) Test Methods used, 4) Per-test results table with judgments, 5) Conclusion + Overall Judgment. Format as markdown.", data: detail };
      }
      case "diagnose_ng_result": {
        const detail = await runTool(supabase, "get_sample_detail", { sample_id: args.sample_id });
        const ngResults = (detail.results ?? []).filter((r: any) => r.judgment === "NG" && (!args.test_item_id || r.test_item_id === args.test_item_id));
        const similar = await Promise.all(ngResults.slice(0, 3).map((r: any) => runTool(supabase, "find_similar_failures", { test_item_id: r.test_item_id, material_id: detail.sample?.material_id })));
        return { instruction: "Diagnose the NG: explain why it failed (compare value to spec), list 3-5 likely root causes, list historical similar failures, propose corrective actions.", sample_detail: detail, ng_results: ngResults, historical_patterns: similar };
      }
      case "suggest_test_program": {
        const programs = await supabase.from("test_programs").select("id, name, description, application, customer_name").limit(50);
        let material = null;
        if (args.material_id) {
          const { data } = await supabase.from("materials").select("name, material_type").eq("id", args.material_id).single();
          material = data;
        }
        let customerHistory = null;
        if (args.customer_id) {
          const { data } = await supabase.from("test_reports").select("test_program_id").eq("customer_id", args.customer_id).limit(20);
          customerHistory = data;
        }
        return { instruction: "Recommend the best 1-3 test programs for this scenario. Justify each pick.", available_programs: programs.data, material, customer_history: customerHistory, intended_use: args.intended_use };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ============================================================================
// MAIN HANDLER — agentic loop with streaming final response
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { conversation_id, messages: userMessages, context, mode } = await req.json();

    // Build conversation context line
    let contextLine = "";
    if (context?.type && context?.id) {
      contextLine = `\n\nCurrent context: User is viewing a ${context.type} (id: ${context.id}${context.label ? `, "${context.label}"` : ""}). Use this as the default subject when ambiguous.`;
    }

    const modeAddendum = MODE_ADDENDA[mode as string] ?? "";
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + modeAddendum + contextLine },
      ...userMessages,
    ];

    // Agentic loop: up to 6 tool-call rounds, then stream the final answer
    const MAX_ROUNDS = 6;
    const toolEvents: any[] = [];

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages,
          tools: TOOLS,
          tool_choice: "auto",
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "AI rate limit hit. Please retry in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "AI workspace credits exhausted. Top up at Settings > Workspace > Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await resp.text();
        console.error("AI error:", resp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;

      // If model called tools, run them and append results
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push(msg);
        for (const tc of msg.tool_calls) {
          const args = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          const start = Date.now();
          const result = await runTool(supabase, tc.function.name, args ?? {});
          const duration = Date.now() - start;
          toolEvents.push({ tool: tc.function.name, args, duration_ms: duration, ok: !result.error });

          // Audit log
          try {
            await supabase.from("copilot_action_log").insert({
              conversation_id, user_id: user.id,
              tool_name: tc.function.name, arguments: args ?? {},
              result_summary: result.error ? `Error: ${result.error}` : `Returned ${Object.keys(result).join(", ")}`,
              status: result.error ? "failed" : "completed",
              error: result.error ?? null, duration_ms: duration,
            });
          } catch (e) { console.error("audit log fail", e); }

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result).slice(0, 50000), // cap to avoid huge contexts
          });
        }
        continue; // next round — let model see tool results
      }

      // No more tool calls — return final assistant message
      const finalContent = msg.content ?? "";

      // Persist messages
      if (conversation_id) {
        try {
          // Persist user's last message
          const lastUser = userMessages[userMessages.length - 1];
          if (lastUser?.role === "user") {
            await supabase.from("copilot_messages").insert({
              conversation_id, role: "user", content: lastUser.content,
            });
          }
          await supabase.from("copilot_messages").insert({
            conversation_id, role: "assistant", content: finalContent,
            model: "google/gemini-2.5-pro",
            tool_calls: toolEvents.length > 0 ? toolEvents : null,
            finish_reason: choice.finish_reason,
          });
        } catch (e) { console.error("persist messages fail", e); }
      }

      return new Response(JSON.stringify({
        content: finalContent,
        tool_events: toolEvents,
        finish_reason: choice.finish_reason,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ content: "I hit my reasoning limit. Please refine the question.", tool_events: toolEvents }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
