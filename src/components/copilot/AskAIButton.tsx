import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DraftKind = "report" | "email" | "diagnosis" | "generic";

export type AskAIAction = {
  label: string;
  emoji?: string;
  prompt: string;
  description?: string;
  /** If set, the response will be intercepted by a review modal before "sending". */
  draftKind?: DraftKind;
};

export type AskAIContext = {
  type:
    | "sample"
    | "test_request"
    | "test_report"
    | "customer"
    | "supplier"
    | "material"
    | "equipment"
    | "task"
    | "planning";
  id: string;
  label?: string;
};

interface Props {
  context: AskAIContext;
  actions: AskAIAction[];
  primaryAction?: AskAIAction; // shown as the main click; others in dropdown
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  iconOnly?: boolean; // compact mode for table rows
  title?: string;
}

/**
 * Inline launcher: click the main button to fire the primary AI action,
 * or open the dropdown for other prompts. All actions navigate to /copilot
 * with a prefilled context + auto-sent prompt.
 */
export function AskAIButton({
  context,
  actions,
  primaryAction,
  size = "sm",
  variant = "outline",
  className,
  iconOnly = false,
  title = "Ask AI",
}: Props) {
  const navigate = useNavigate();
  const primary = primaryAction ?? actions[0];

  const launch = (action: AskAIAction) => {
    navigate("/copilot", {
      state: {
        autoLaunch: {
          context,
          prompt: action.prompt,
          draftKind: action.draftKind,
          actionLabel: action.label,
        },
      },
    });
  };

  if (iconOnly) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-8 p-0 text-primary hover:bg-primary/10 hover:text-primary",
              className
            )}
            title={title}
            aria-label={title}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Lab Copilot · 1-click actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actions.map((a, i) => (
            <DropdownMenuItem
              key={i}
              onClick={() => launch(a)}
              className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {a.emoji && <span>{a.emoji}</span>}
                {a.label}
              </div>
              {a.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 pl-6">
                  {a.description}
                </p>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("inline-flex items-stretch rounded-md shadow-sm", className)}>
      <Button
        size={size}
        variant={variant}
        onClick={() => launch(primary)}
        className={cn(
          "gap-1.5 rounded-r-none border-r-0",
          variant === "outline" &&
            "border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {primary.label}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size={size}
            variant={variant}
            className={cn(
              "rounded-l-none px-1.5",
              variant === "outline" &&
                "border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
            )}
            aria-label="More AI actions"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Lab Copilot · 1-click actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actions.map((a, i) => (
            <DropdownMenuItem
              key={i}
              onClick={() => launch(a)}
              className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {a.emoji && <span>{a.emoji}</span>}
                {a.label}
              </div>
              {a.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 pl-6">
                  {a.description}
                </p>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Preset action builders ──────────────────────────────────────────────────

export function getSampleAIActions(sampleLabel: string): AskAIAction[] {
  return [
    {
      label: "Summarise sample",
      emoji: "📋",
      description: "Executive summary of identification, tests assigned, results and judgment.",
      prompt: `Give me a concise executive summary of sample "${sampleLabel}". Cover: identification, material, customer, tests assigned, current results with judgments, and the overall status.`,
    },
    {
      label: "Diagnose NG results",
      emoji: "🔍",
      description: "Root cause + corrective actions for any failed tests on this sample.",
      prompt: `Run a full NG diagnosis for sample "${sampleLabel}". For every NG result: explain why it failed (compare actual vs spec), list 3-5 likely root causes, find similar historical failures, and propose corrective actions.`,
      draftKind: "diagnosis",
    },
    {
      label: "Draft test report",
      emoji: "📝",
      description: "Full formal report with executive summary, per-test commentary, conclusion.",
      prompt: `Draft a formal test report for sample "${sampleLabel}". Include executive summary, sample identification table, test methods used, per-test results table with judgments, conclusion and overall judgment.`,
      draftKind: "report",
    },
    {
      label: "Compare to spec",
      emoji: "📐",
      description: "Highlight any deviations from material specification.",
      prompt: `Compare every result on sample "${sampleLabel}" against the material specification. Flag every deviation, even within tolerance, and rate the severity of each.`,
    },
    {
      label: "Draft customer email",
      emoji: "✉️",
      description: "Professional email summarising results for the customer.",
      prompt: `Draft a professional customer email to deliver the results of sample "${sampleLabel}". Tone: confident, technical, transparent about any issues. Include a brief summary, key findings, and clear next steps.`,
      draftKind: "email",
    },
  ];
}

export function getTestRequestAIActions(requestNumber: string): AskAIAction[] {
  return [
    {
      label: "Summarise request",
      emoji: "📋",
      description: "Brief on scope, status, samples linked, and what's outstanding.",
      prompt: `Summarise customer test request "${requestNumber}". Cover: requested scope, current status, samples linked to it, completed vs outstanding tests, and any risk if the due date is near.`,
    },
    {
      label: "Suggest test program",
      emoji: "🧪",
      description: "Recommend the best test program(s) to fulfil this request.",
      prompt: `For test request "${requestNumber}", recommend the most appropriate test program(s). Justify each pick based on the customer, intended use, and material involved.`,
    },
    {
      label: "Status update email",
      emoji: "✉️",
      description: "Draft a status email to the customer.",
      prompt: `Draft a customer status update email for test request "${requestNumber}". Be transparent about progress, blockers, and expected completion.`,
      draftKind: "email",
    },
    {
      label: "Risk check",
      emoji: "⚠️",
      description: "Flag overdue risk, missing samples, calibration risks.",
      prompt: `Run a risk check on test request "${requestNumber}". Check: overdue status, samples not yet received, equipment calibration risk on the methods needed, and any other blockers.`,
    },
  ];
}

export function getReportAIActions(reportNumber: string): AskAIAction[] {
  return [
    {
      label: "Summarise report",
      emoji: "📋",
      description: "Executive summary of the report's findings and judgment.",
      prompt: `Summarise issued test report "${reportNumber}". Include scope, key findings, overall judgment, and any caveats.`,
    },
    {
      label: "Draft cover email",
      emoji: "✉️",
      description: "Professional cover email to deliver this report to the customer.",
      prompt: `Draft a professional cover email to deliver test report "${reportNumber}" to the customer. Include a 2-3 line summary of findings and the overall judgment, and an offer to discuss.`,
      draftKind: "email",
    },
    {
      label: "Explain NG findings",
      emoji: "🔍",
      description: "Explain in plain language what failed and why.",
      prompt: `For report "${reportNumber}", explain in clear, professional language any NG findings — what failed, why it likely failed, and what corrective steps the customer should consider.`,
    },
    {
      label: "Compliance check",
      emoji: "✅",
      description: "Verify report covers all customer requirements.",
      prompt: `For report "${reportNumber}", check whether all originally-requested tests from the linked customer test request are covered. Flag any missing tests or gaps.`,
    },
  ];
}

export function getEquipmentAIActions(equipmentName: string): AskAIAction[] {
  return [
    {
      label: "Diagnose calibration",
      emoji: "🔧",
      description: "Analyse calibration history, detect drift trends, and flag risks.",
      prompt: `Analyse the calibration history of equipment "${equipmentName}". Detect drift trends, flag any out-of-tolerance events, identify methods at risk if calibration lapses, and rate overall calibration health.`,
    },
    {
      label: "Plan maintenance",
      emoji: "📅",
      description: "Recommend a maintenance schedule based on usage and history.",
      prompt: `Recommend a maintenance schedule for equipment "${equipmentName}". Base it on its maintenance history, calibration cadence, manufacturer norms for this type of equipment, and current usage. Provide a 12-month plan.`,
    },
    {
      label: "Draft calibration cert",
      emoji: "📝",
      description: "Formal calibration certificate from the latest calibration data.",
      prompt: `Draft a formal calibration certificate for equipment "${equipmentName}" based on its most recent calibration. Include identification, calibration date and due date, results vs tolerance, traceability, and a clear statement of conformity.`,
      draftKind: "report",
    },
    {
      label: "Risk assessment",
      emoji: "⚠️",
      description: "Overdue cal, methods affected, customer impact.",
      prompt: `Run a full risk assessment on equipment "${equipmentName}". Cover: calibration overdue risk, maintenance overdue risk, list of test methods that depend on it, list of open samples/requests that would be blocked if it fails, and a risk score.`,
    },
    {
      label: "Generate SOP draft",
      emoji: "📋",
      description: "Operating procedure draft based on equipment specs and linked methods.",
      prompt: `Generate a draft Standard Operating Procedure for equipment "${equipmentName}". Cover: scope, safety precautions, pre-checks, step-by-step operation, post-use cleaning, calibration verification, and troubleshooting common issues.`,
      draftKind: "report",
    },
  ];
}

export function getMaterialAIActions(materialName: string): AskAIAction[] {
  return [
    {
      label: "Recommend test program",
      emoji: "🧪",
      description: "Best-fit test programs for this material's intended use.",
      prompt: `Recommend the most appropriate test program(s) for material "${materialName}". Justify each recommendation based on the material composition, structure, intended application, and any relevant industry standards.`,
    },
    {
      label: "Compare to similar",
      emoji: "📐",
      description: "Find peer materials and highlight spec differences.",
      prompt: `Find materials similar to "${materialName}" in the library and produce a side-by-side comparison. Highlight where this material's spec is tighter, looser, or missing parameters compared to its peers.`,
    },
    {
      label: "Performance history",
      emoji: "📊",
      description: "Pass/fail rates and recurring issues across all samples.",
      prompt: `Summarise the historical test performance of material "${materialName}". Cover: total samples tested, overall pass/fail rate, breakdown by test category, recurring failure modes, and any quality trend over time.`,
    },
    {
      label: "Audit spec completeness",
      emoji: "🔍",
      description: "Flag missing parameters vs industry norms.",
      prompt: `Audit the specification of material "${materialName}" for completeness. Compare to industry norms for this material type, flag any missing critical parameters, and rate the overall spec quality.`,
    },
    {
      label: "Draft spec sheet",
      emoji: "✉️",
      description: "Professional one-page spec sheet for customers.",
      prompt: `Draft a professional one-page spec sheet for material "${materialName}" suitable for sharing with customers. Include identification, composition, key technical parameters with tolerances, certifications, and recommended test programs.`,
      draftKind: "report",
    },
  ];
}

export function getCustomerAIActions(customerName: string): AskAIAction[] {
  return [
    {
      label: "Health summary",
      emoji: "📋",
      description: "Open requests, overdue, NG rate, recent activity.",
      prompt: `Give me a full health summary of customer "${customerName}". Cover: open test requests, overdue items, recent samples, overall NG rate, recurring quality issues, and anything that needs management attention.`,
    },
    {
      label: "At-risk items",
      emoji: "⚠️",
      description: "Anything overdue, blocked, or at risk for this customer.",
      prompt: `For customer "${customerName}", list every item that is overdue, blocked, or at risk. Include test requests near or past due, samples awaiting tests, and any equipment-calibration risk affecting their work. Rate severity.`,
    },
    {
      label: "Quality scorecard",
      emoji: "📊",
      description: "Pass rates, recurring issues, broken down by material.",
      prompt: `Build a quality scorecard for customer "${customerName}". Include: overall pass rate, pass rate by material, top 3 failure modes, trend over time, and a one-line quality verdict.`,
    },
    {
      label: "Quarterly review email",
      emoji: "✉️",
      description: "Proactive quarterly update on all their work.",
      prompt: `Draft a professional quarterly review email for customer "${customerName}". Cover: volume of work delivered, key results, quality trend, any issues raised, and an offer to discuss upcoming needs. Tone: confident, partnership-oriented.`,
      draftKind: "email",
    },
    {
      label: "Suggest next tests",
      emoji: "💡",
      description: "Based on their patterns, what tests are they missing?",
      prompt: `Based on customer "${customerName}"'s materials, applications, and historical test patterns, suggest test programs they are NOT currently using but probably should be. Justify each suggestion with a clear quality or compliance rationale.`,
    },
  ];
}

export function getTaskAIActions(taskLabel: string): AskAIAction[] {
  return [
    {
      label: "Break down task",
      emoji: "🧩",
      description: "Split this task into clear, ordered subtasks with estimated effort.",
      prompt: `Break down task "${taskLabel}" into a clear, ordered list of subtasks. For each subtask: give a 1-line description, estimated effort in hours, suggested owner role, and any dependency on previous subtasks.`,
    },
    {
      label: "Suggest assignee",
      emoji: "👤",
      description: "Recommend the best team or person based on skills, load, and history.",
      prompt: `For task "${taskLabel}", recommend the best team and (if possible) individual to assign. Justify based on the task type, required skills, current workload across teams, and past performance on similar tasks.`,
    },
    {
      label: "Risk & blockers",
      emoji: "⚠️",
      description: "What could go wrong, prerequisites, and mitigation steps.",
      prompt: `Run a risk assessment on task "${taskLabel}". List likely blockers, missing prerequisites (samples, calibrated equipment, approvals), realistic completion risk, and mitigation steps.`,
    },
    {
      label: "Draft instructions",
      emoji: "📋",
      description: "Step-by-step instructions the assignee can follow without follow-up.",
      prompt: `Draft clear, step-by-step instructions for completing task "${taskLabel}". Assume the assignee is competent but new to this exact task. Include preparation, execution steps, quality checks, and what "done" looks like.`,
      draftKind: "report",
    },
    {
      label: "Status update",
      emoji: "✉️",
      description: "Short status note for the requester or team chat.",
      prompt: `Draft a concise status update for task "${taskLabel}" suitable for posting to the team or sending to the requester. Cover: current status, what was done, what's next, any blockers.`,
      draftKind: "email",
    },
  ];
}

export function getPlanningAIActions(monthLabel: string): AskAIAction[] {
  return [
    {
      label: "Plan my week",
      emoji: "📅",
      description: "Prioritised plan for the next 7 days based on tasks, deadlines, and capacity.",
      prompt: `Build a prioritised plan for the next 7 days. Pull from open tasks, request due dates, scheduled test jobs, and equipment calibrations. Group by day, flag overloaded days, and highlight the top 3 critical items.`,
    },
    {
      label: "Capacity check",
      emoji: "📊",
      description: "Spot bottlenecks and overloaded teams or equipment in this period.",
      prompt: `Run a capacity check for ${monthLabel}. Identify overloaded teams, equipment booked past safe utilisation, and scheduling conflicts. Recommend which jobs to reschedule and to when.`,
    },
    {
      label: "Deadline risk scan",
      emoji: "⚠️",
      description: "All deadlines at risk this period and why.",
      prompt: `Scan all deadlines (request due dates, calibration dues, scheduled jobs) for ${monthLabel}. List every item at risk of slipping, the reason, the customer/internal impact, and one recommended action per risk.`,
    },
    {
      label: "Calibration outlook",
      emoji: "🔧",
      description: "Upcoming calibrations, methods affected if they slip.",
      prompt: `Summarise the calibration outlook for ${monthLabel}. List every equipment due for calibration, its calibration date, methods that depend on it, and the downstream impact if the calibration is missed or delayed.`,
    },
    {
      label: "Optimise schedule",
      emoji: "💡",
      description: "Suggest schedule changes to smooth load and hit more deadlines.",
      prompt: `Suggest schedule optimisations for ${monthLabel}. Reorder, batch, or move jobs to: smooth team load, reduce equipment idle time between similar tests, and increase the chance of hitting customer deadlines. Justify each suggested move.`,
    },
  ];
}
