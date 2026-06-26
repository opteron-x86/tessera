import { Badge } from "@/components/ui/panel";
import type { RuleSet } from "@/game/types";

const RULE_LABELS: Array<{ id: keyof RuleSet; label: string }> = [
  { id: "open", label: "Open" },
  { id: "same", label: "Same" },
  { id: "plus", label: "Plus" },
  { id: "combo", label: "Combo" },
  { id: "sameWall", label: "Same Wall" },
  { id: "random", label: "Random" },
  { id: "legion", label: "Legion" },
  { id: "decimation", label: "Decimation" },
  { id: "suddenDeath", label: "Sudden Death" }
];

export function RulePills({ rules }: { rules: RuleSet }) {
  const active = RULE_LABELS.filter((rule) => rules[rule.id]);
  if (active.length === 0) {
    return <span className="text-xs text-content-faint">No special rules</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {active.map((rule) => (
        <Badge key={rule.id} className="border-accent/40 text-accent">
          {rule.label}
        </Badge>
      ))}
    </div>
  );
}
