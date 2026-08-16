import { Suspense, lazy, useState } from "react";
import { SubTabs } from "./ui/SubTabs";

// Three substantial calculators; only the one being looked at is fetched.
const GratuityCalculator = lazy(() => import("./GratuityCalculator"));
const EpfCalculator = lazy(() => import("./EpfCalculator"));
const LeaveEncashmentCalculator = lazy(
  () => import("./LeaveEncashmentCalculator")
);

type Tool = "gratuity" | "epf" | "leave";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "gratuity", label: "Gratuity" },
  { id: "epf", label: "EPF & VPF" },
  { id: "leave", label: "Leave encashment" },
];

/**
 * The three calculations that only matter when you leave, or when you are
 * planning for the day you do. Grouped because nobody opens them in isolation:
 * working out a final settlement means all three at once.
 */
export default function RetiralsTab() {
  const [tool, setTool] = useState<Tool>("gratuity");
  const [opened, setOpened] = useState<Set<Tool>>(new Set(["gratuity"]));

  const select = (next: Tool) => {
    setTool(next);
    setOpened((current) => new Set(current).add(next));
  };

  return (
    <div className="space-y-5">
      <SubTabs
        label="Retirement and exit calculators"
        items={TOOLS}
        active={tool}
        onSelect={select}
      />

      <Suspense
        fallback={
          <p className="text-sm text-[color:var(--ink-muted)] py-6">
            Loading the calculator…
          </p>
        }
      >
        {/* Kept mounted once opened, so switching between the three never
            discards what was typed into the others. */}
        {opened.has("gratuity") && (
          <div className={tool === "gratuity" ? undefined : "hidden"}>
            <GratuityCalculator />
          </div>
        )}
        {opened.has("epf") && (
          <div className={tool === "epf" ? undefined : "hidden"}>
            <EpfCalculator />
          </div>
        )}
        {opened.has("leave") && (
          <div className={tool === "leave" ? undefined : "hidden"}>
            <LeaveEncashmentCalculator />
          </div>
        )}
      </Suspense>
    </div>
  );
}
