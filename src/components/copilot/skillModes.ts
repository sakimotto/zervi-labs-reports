// Lab Copilot — Skill Modes
// Each mode swaps the system prompt sent to the agent, the welcome screen,
// and the colour accent in the UI. Modes are persisted on the conversation row.

import {
  Sparkles,
  Stethoscope,
  FileText,
  Clock,
  Ruler,
  Settings2,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type SkillModeId =
  | "general"
  | "ng_diagnosis"
  | "report_drafting"
  | "backlog_sla"
  | "spec_compliance"
  | "equipment_calibration"
  | "lab_analytics";

export type StarterPrompt = {
  emoji: string;
  title: string;
  prompt: string;
};

export type SkillMode = {
  id: SkillModeId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  /** Tailwind utility classes — semantic tokens only. */
  accentBg: string;
  accentText: string;
  accentRing: string;
  /** Send button gradient class. */
  sendBtnClass: string;
  description: string;
  welcome: {
    headline: string;
    blurb: string;
  };
  systemAddendum: string;
  starters: StarterPrompt[];
};

export const SKILL_MODES: Record<SkillModeId, SkillMode> = {
  general: {
    id: "general",
    label: "General",
    shortLabel: "General",
    icon: Sparkles,
    accentBg: "bg-primary/10",
    accentText: "text-primary",
    accentRing: "ring-primary/30",
    sendBtnClass: "bg-gradient-primary",
    description: "Full-spectrum lab assistant. Ask anything across samples, materials, customers, equipment.",
    welcome: {
      headline: "Hi, I'm your Lab Copilot",
      blurb: "Full read access across samples, materials, customers, suppliers, equipment, methods and standards.",
    },
    systemAddendum: "",
    starters: [
      { emoji: "📊", title: "Give me a snapshot of the lab right now", prompt: "Give me a snapshot of the lab right now — open work, NG count, equipment due for calibration, overdue requests." },
      { emoji: "🔬", title: "Show the 10 most recently received samples", prompt: "Show me the 10 most recently received samples and their current status." },
      { emoji: "📅", title: "What customer requests are overdue?", prompt: "List all overdue customer test requests sorted by how late they are." },
      { emoji: "🧪", title: "Recommend a test program for a new sample", prompt: "Recommend a test program for an automotive seat fabric sample from a new OEM customer." },
    ],
  },

  ng_diagnosis: {
    id: "ng_diagnosis",
    label: "NG Diagnosis",
    shortLabel: "NG Diag",
    icon: Stethoscope,
    accentBg: "bg-destructive/10",
    accentText: "text-destructive",
    accentRing: "ring-destructive/30",
    sendBtnClass: "bg-destructive hover:bg-destructive/90",
    description: "Root-cause analysis for failed tests. Patterns across material, customer, method.",
    welcome: {
      headline: "NG Diagnosis Mode",
      blurb: "I'll dig into failed tests — pinpoint root causes, find historical patterns, and propose corrective actions.",
    },
    systemAddendum: `
## MODE: NG Diagnosis
You are now in **failure investigation mode**. Default behaviour:
- For any sample / test the user mentions, immediately query results and identify NG findings.
- Always run a structured diagnosis: (1) what failed vs spec, (2) magnitude of deviation, (3) 3-5 plausible root causes ranked by likelihood, (4) similar historical failures from the database, (5) corrective actions.
- Cross-reference equipment calibration status, conditioning, SOP version, and material spec deviations.
- Flag systemic patterns (same material across customers, same method across samples, same operator, same equipment).
- Be blunt about uncertainty — if data is missing, say what you'd need.`,
    starters: [
      { emoji: "🔍", title: "Show all samples currently judged NG", prompt: "Show me all samples currently judged NG. Group by material and customer, identify any patterns." },
      { emoji: "📉", title: "How is our NG rate trending this month?", prompt: "What's our NG rate this month vs last month? Break down by test method and flag any methods with spiking failures." },
      { emoji: "🧩", title: "Diagnose the most recent NG result", prompt: "Diagnose the most recent NG result in the system — root cause, similar historical failures, corrective actions." },
      { emoji: "⚠️", title: "Which materials fail most often?", prompt: "Which materials or customers have produced the most NG results in the last 90 days?" },
    ],
  },

  report_drafting: {
    id: "report_drafting",
    label: "Report Drafting",
    shortLabel: "Reports",
    icon: FileText,
    accentBg: "bg-primary/10",
    accentText: "text-primary",
    accentRing: "ring-primary/30",
    sendBtnClass: "bg-gradient-primary",
    description: "Generate formal test reports and customer correspondence — every output goes through review.",
    welcome: {
      headline: "Report Drafting Mode",
      blurb: "Formal test reports, cover emails, and findings summaries. Every draft is intercepted for your review before sending.",
    },
    systemAddendum: `
## MODE: Report Drafting
You are now in **formal report mode**. Default behaviour:
- Produce report-grade output: executive summary, sample identification table, test methods + standards, per-test results table with units and judgments, conclusion, overall judgment.
- Use markdown tables for results. Cite the standard version (e.g. JIS L 1096:2020).
- Maintain ISO 17025 tone — factual, traceable, non-promotional.
- Always end with: "**This is a draft for your review** — please verify all values against source data before issuing."
- For emails: subject line, professional greeting, 2-3 line summary, key findings, clear next steps, sign-off placeholder.`,
    starters: [
      { emoji: "📝", title: "Draft a formal test report for a sample", prompt: "Help me draft a formal test report for sample [paste sample code or ID]. Include all the standard sections." },
      { emoji: "✉️", title: "Write a cover email for a test report", prompt: "Draft a professional cover email to deliver test report [paste report number] to the customer." },
      { emoji: "📋", title: "Summarise the latest report for executives", prompt: "Summarise the key findings from the most recent issued test report in 3 bullet points for an executive audience." },
      { emoji: "🔁", title: "Tighten the executive summary in my last draft", prompt: "Take the last draft you produced and tighten the executive summary — more direct, less hedging." },
    ],
  },

  backlog_sla: {
    id: "backlog_sla",
    label: "Backlog & SLA",
    shortLabel: "Backlog",
    icon: Clock,
    accentBg: "bg-warning/10",
    accentText: "text-warning",
    accentRing: "ring-warning/30",
    sendBtnClass: "bg-warning hover:bg-warning/90 text-warning-foreground",
    description: "Overdue requests, due-soon work, capacity bottlenecks, calibration risk.",
    welcome: {
      headline: "Backlog & SLA Mode",
      blurb: "Track due dates, overdue work, capacity risk, and calibration windows that could block delivery.",
    },
    systemAddendum: `
## MODE: Backlog & SLA
You are now in **operations / SLA mode**. Default behaviour:
- Lead every answer with overdue/at-risk items.
- Always show: days overdue, days remaining, owner if known, blocking dependency (sample not received, equipment due cal, etc.).
- Suggest a prioritised action list at the end of every response.
- Quantify risk: number of customer requests, monetary value if available, days of delay.
- If asked anything ambiguous, default scope to "next 14 days".`,
    starters: [
      { emoji: "🚨", title: "List every overdue customer test request", prompt: "List every overdue customer test request, sorted by days overdue, with the blocker for each." },
      { emoji: "📅", title: "What's due in the next 7 days?", prompt: "What's due in the next 7 days? Flag anything at risk of slipping." },
      { emoji: "🛠️", title: "Which calibrations could block delivery?", prompt: "Which equipment is due for calibration in the next 14 days, and which active test requests depend on it?" },
      { emoji: "📦", title: "What's blocked waiting on samples?", prompt: "Which test requests are blocked because samples haven't been received yet?" },
    ],
  },

  spec_compliance: {
    id: "spec_compliance",
    label: "Spec Compliance",
    shortLabel: "Specs",
    icon: Ruler,
    accentBg: "bg-accent/30",
    accentText: "text-accent-foreground",
    accentRing: "ring-accent/40",
    sendBtnClass: "bg-accent hover:bg-accent/90 text-accent-foreground",
    description: "Compare results vs material specs, OEM requirements, and JIS/ISO/ASTM/VDA standards.",
    welcome: {
      headline: "Spec Compliance Mode",
      blurb: "Verify every result against the material spec and the relevant OEM/industry standard. Surface deviations early.",
    },
    systemAddendum: `
## MODE: Spec Compliance
You are now in **spec verification mode**. Default behaviour:
- For any sample/material discussion: pull the material spec and compare every result.
- Use a comparison table: parameter | spec | tolerance | actual | within? | severity.
- Severity scale: Pass / Marginal (within tol but >80% of limit) / Fail.
- Always reference the standard and version (e.g. JIS L 1096:2020 §8.10).
- If multiple OEM specs apply, run the comparison against each.
- Flag any test that should have been run per the spec but is missing.`,
    starters: [
      { emoji: "📐", title: "Compare a sample's results to its spec", prompt: "For sample [code], compare every result to the material spec. Flag deviations and rate severity." },
      { emoji: "🏷️", title: "Verify the latest OEM samples meet OEM specs", prompt: "Take the most recent OEM customer's last 5 samples and verify each one meets the OEM spec they require." },
      { emoji: "📚", title: "Which standards and versions do we test against?", prompt: "Which JIS/ISO/ASTM/VDA standards do we currently test against, and which versions are we on?" },
      { emoji: "❓", title: "Find samples missing required tests", prompt: "Find samples where the assigned test program didn't cover all parameters required by the material spec." },
    ],
  },

  equipment_calibration: {
    id: "equipment_calibration",
    label: "Equipment & Cal",
    shortLabel: "Equipment",
    icon: Settings2,
    accentBg: "bg-secondary",
    accentText: "text-secondary-foreground",
    accentRing: "ring-secondary",
    sendBtnClass: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    description: "Equipment health, calibration due dates, maintenance history, downtime impact.",
    welcome: {
      headline: "Equipment & Calibration Mode",
      blurb: "Calibration windows, maintenance history, condition ratings, and which tests each instrument is qualified to run.",
    },
    systemAddendum: `
## MODE: Equipment & Calibration
You are now in **equipment / metrology mode**. Default behaviour:
- Lead with calibration status whenever an instrument is mentioned.
- Show: name, category, condition rating, last cal date, next due, days remaining, in/out of tolerance, linked methods.
- Flag every Out-of-Cal or Due-in-≤14-days instrument unprompted.
- For maintenance discussions, summarise downtime hours, total cost, and last 5 events.
- If the user asks about a test method, list the qualified instruments and any calibration risk.`,
    starters: [
      { emoji: "🛠️", title: "What equipment needs calibration in 30 days?", prompt: "Which equipment is due for calibration in the next 30 days? Flag anything overdue." },
      { emoji: "❌", title: "List all equipment currently Out of Cal", prompt: "List all equipment currently Out of Cal and which test methods they affect." },
      { emoji: "📈", title: "Show maintenance downtime by instrument", prompt: "Show maintenance downtime hours by instrument over the last 90 days. Highlight problem units." },
      { emoji: "🔗", title: "Which methods rely on a single instrument?", prompt: "For each active test method, list the qualified equipment and flag any method with only one qualified instrument." },
    ],
  },

  lab_analytics: {
    id: "lab_analytics",
    label: "Lab Analytics",
    shortLabel: "Analytics",
    icon: BarChart3,
    accentBg: "bg-success/10",
    accentText: "text-success",
    accentRing: "ring-success/30",
    sendBtnClass: "bg-success hover:bg-success/90 text-success-foreground",
    description: "Throughput, NG rates, customer mix, method utilisation, capacity trends.",
    welcome: {
      headline: "Lab Analytics Mode",
      blurb: "Trends across samples, NG rates, customer mix, method utilisation, and capacity.",
    },
    systemAddendum: `
## MODE: Lab Analytics
You are now in **analytics mode**. Default behaviour:
- Always quantify. Counts, rates, percentages, period-over-period deltas.
- Present numbers in markdown tables with a clear "vs prior period" column whenever possible.
- For any trend question, default window is "last 30 days vs prior 30 days" unless specified.
- Call out the top 3 movers (positive or negative).
- End every answer with one "so what" insight — not a recap.`,
    starters: [
      { emoji: "📊", title: "Monthly throughput", prompt: "How many samples did we process this month vs last month? Break down by customer and material." },
      { emoji: "📉", title: "NG rate by customer", prompt: "Show NG rate by customer over the last 90 days. Highlight any customer with NG rate above 20%." },
      { emoji: "🧪", title: "Method utilisation", prompt: "Which test methods are run most often, and which haven't been run in 60+ days?" },
      { emoji: "👥", title: "Customer mix", prompt: "Top 10 customers by sample volume this quarter, with their NG rate and on-time delivery rate." },
    ],
  },
};

export const SKILL_MODE_LIST: SkillMode[] = [
  SKILL_MODES.general,
  SKILL_MODES.ng_diagnosis,
  SKILL_MODES.report_drafting,
  SKILL_MODES.backlog_sla,
  SKILL_MODES.spec_compliance,
  SKILL_MODES.equipment_calibration,
  SKILL_MODES.lab_analytics,
];

export function getMode(id: string | null | undefined): SkillMode {
  if (!id) return SKILL_MODES.general;
  return (SKILL_MODES as any)[id] ?? SKILL_MODES.general;
}
