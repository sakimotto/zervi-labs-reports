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
  type: "sample" | "test_request" | "test_report" | "customer" | "supplier" | "material";
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
