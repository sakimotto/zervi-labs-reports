import { Wrench, CheckCircle2, XCircle } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  search_samples: "Searching samples",
  get_sample_detail: "Loading sample detail",
  search_materials: "Searching materials",
  get_material_detail: "Loading material",
  search_customers: "Searching customers",
  get_customer_detail: "Loading customer",
  search_suppliers: "Searching suppliers",
  get_supplier_detail: "Loading supplier",
  list_test_methods: "Browsing test methods",
  list_test_programs: "Browsing test programs",
  get_equipment_status: "Checking equipment",
  list_standards: "Browsing standards",
  get_open_test_requests: "Loading open requests",
  find_similar_failures: "Searching similar failures",
  get_lab_dashboard: "Loading lab dashboard",
  draft_test_report: "Drafting test report",
  diagnose_ng_result: "Diagnosing NG result",
  suggest_test_program: "Suggesting test program",
};

export function ToolCallStrip({ events }: { events: any[] }) {
  if (!events || events.length === 0) return null;
  return (
    <div className="space-y-1 mb-2">
      {events.map((e, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md border border-border/60 bg-muted/40"
        >
          <Wrench className="h-3 w-3 text-primary shrink-0" />
          <span className="font-medium text-foreground/80">
            {TOOL_LABELS[e.tool] || e.tool}
          </span>
          <span className="text-muted-foreground">· {e.duration_ms}ms</span>
          {e.ok ? (
            <CheckCircle2 className="h-3 w-3 text-success ml-auto" />
          ) : (
            <XCircle className="h-3 w-3 text-destructive ml-auto" />
          )}
        </div>
      ))}
    </div>
  );
}
