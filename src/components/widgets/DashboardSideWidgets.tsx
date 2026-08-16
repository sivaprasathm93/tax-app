import { useMemo } from "react";
import {
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  Zap,
  Users,
} from "lucide-react";
import { ComparisonResult, TaxInput, Profile } from "../../types";
import { CALENDAR_EVENTS } from "../../constants/calendar";
import { MEAL_VOUCHER, DEDUCTION_LIMITS } from "../../constants/taxRules";
import { downloadIcs } from "../../utils/ics";

interface Props {
  input: TaxInput;
  comparison: ComparisonResult | null;
  activeProfile: Profile;
  profiles: Profile[];
  onSwitchProfile: (id: string) => void;
  onNavigateTool: (tool: string) => void;
  onApplyOptimization: (field: string, amount: number) => void;
}

export function DashboardSideWidgets({
  input,
  comparison,
  activeProfile,
  profiles,
  onSwitchProfile,
  onNavigateTool,
  onApplyOptimization,
}: Props) {
  // 1. Calculate Tax Health / Shield Score (0 - 100)
  const healthScore = useMemo(() => {
    let score = 0;
    const checks: { label: string; done: boolean; tip: string; field?: string; amount?: number }[] = [];

    // Basic income setup
    if (input.grossIncome > 0) {
      score += 30;
      checks.push({ label: "Income configured", done: true, tip: "Salary profile loaded." });
    } else {
      checks.push({ label: "Income configured", done: false, tip: "Enter gross income to begin." });
    }

    // New Regime auto-benefits or Old Regime optimization
    const isNew = comparison?.betterRegime === "new";

    // Standard deduction
    score += 20;
    checks.push({ label: "Standard deduction claimed", done: true, tip: isNew ? "₹75,000 auto-claimed." : "₹50,000 claimed." });

    // Meal vouchers
    if (input.mealVouchers >= MEAL_VOUCHER.annualCap) {
      score += 15;
      checks.push({ label: "Meal vouchers maxed out", done: true, tip: "₹52,800 tax-free food allowance active." });
    } else {
      checks.push({
        label: "Meal vouchers (Rule 15(5)(a))",
        done: false,
        tip: "Claim up to ₹52,800/yr tax-free.",
        field: "mealVouchers",
        amount: MEAL_VOUCHER.annualCap,
      });
    }

    // 80C
    if (isNew || input.section80C >= DEDUCTION_LIMITS.section80C) {
      score += 15;
      checks.push({ label: "Section 80C shield", done: true, tip: isNew ? "New regime provides lower base rates." : "₹1.5 Lakhs maxed out." });
    } else {
      checks.push({
        label: "Section 80C limit",
        done: false,
        tip: `Claim up to ₹1,50,000 (EPF, ELSS, PPF).`,
        field: "section80C",
        amount: DEDUCTION_LIMITS.section80C,
      });
    }

    // 80D Health Insurance
    if (isNew || input.section80D >= 25000) {
      score += 10;
      checks.push({ label: "Health insurance (80D)", done: true, tip: "Health insurance tax shield active." });
    } else {
      checks.push({
        label: "Health insurance (80D)",
        done: false,
        tip: "Save tax on medical insurance premiums.",
        field: "section80D",
        amount: 25000,
      });
    }

    // HRA
    if (isNew || (input.rentPaid > 0 && input.hraReceived > 0)) {
      score += 10;
      checks.push({ label: "HRA exemption", done: true, tip: "HRA deduction applied." });
    } else {
      checks.push({ label: "HRA & rent receipts", done: false, tip: "Declare rent to claim section 10(13A)." });
    }

    return { score: Math.min(100, score), checks };
  }, [input, comparison]);

  // 2. Upcoming Deadlines
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    const sorted = [...CALENDAR_EVENTS]
      .filter((ev) => {
        const [y, m, d] = (ev.endDate ?? ev.date).split("-").map(Number);
        return new Date(y, m - 1, d) >= today;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);

    return sorted.length > 0 ? sorted : CALENDAR_EVENTS.slice(0, 3);
  }, []);

  return (
    <aside aria-label="Tax Intelligence Widgets" className="space-y-4">
      {/* ── Widget 1: Tax Health & Optimization Score ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Tax Health Score
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              healthScore.score >= 80
                ? "bg-emerald-100 text-emerald-800"
                : healthScore.score >= 50
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {healthScore.score} / 100
          </span>
        </div>

        {/* Score Progress Bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              healthScore.score >= 80
                ? "bg-emerald-500"
                : healthScore.score >= 50
                ? "bg-amber-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${healthScore.score}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="space-y-2 text-xs">
          {healthScore.checks.map((chk, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-2 min-w-0">
                {chk.done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p
                    className={`font-medium truncate ${
                      chk.done ? "text-slate-800" : "text-slate-900"
                    }`}
                  >
                    {chk.label}
                  </p>
                  <p className="text-[11px] text-slate-500">{chk.tip}</p>
                </div>
              </div>
              {!chk.done && chk.field && chk.amount && (
                <button
                  type="button"
                  onClick={() => onApplyOptimization(chk.field!, chk.amount!)}
                  className="shrink-0 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60"
                >
                  Claim
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Widget 2: What-If Quick Tax Simulator ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              What-If Quick Actions
            </h3>
            <p className="text-[11px] text-slate-500">
              1-click test tax optimizations
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {/* Meal Card */}
          {input.mealVouchers < MEAL_VOUCHER.annualCap && (
            <button
              type="button"
              onClick={() =>
                onApplyOptimization("mealVouchers", MEAL_VOUCHER.annualCap)
              }
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <div>
                <span className="font-semibold text-slate-800 block group-hover:text-blue-700">
                  + Add Food Card (₹52.8k)
                </span>
                <span className="text-[11px] text-slate-500">
                  Rule 15(5)(a) tax exemption
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {/* NPS 80CCD(1B) */}
          {input.section80CCD1B < 50000 && (
            <button
              type="button"
              onClick={() => onApplyOptimization("section80CCD1B", 50000)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <div>
                <span className="font-semibold text-slate-800 block group-hover:text-blue-700">
                  + Add NPS 80CCD(1B) (₹50k)
                </span>
                <span className="text-[11px] text-slate-500">
                  Extra deduction under Old Regime
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {/* Health Insurance 80D */}
          {input.section80D < 25000 && (
            <button
              type="button"
              onClick={() => onApplyOptimization("section80D", 25000)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <div>
                <span className="font-semibold text-slate-800 block group-hover:text-blue-700">
                  + Add Health Insurance (₹25k)
                </span>
                <span className="text-[11px] text-slate-500">
                  Section 80D medical coverage
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {/* Section 80C Full */}
          {input.section80C < 150000 && (
            <button
              type="button"
              onClick={() => onApplyOptimization("section80C", 150000)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <div>
                <span className="font-semibold text-slate-800 block group-hover:text-blue-700">
                  + Max Out 80C (₹1.5 Lakhs)
                </span>
                <span className="text-[11px] text-slate-500">
                  EPF, ELSS, PPF, Life Insurance
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Widget 3: Key Deadlines & Calendar Sync ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Upcoming Deadlines
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTool("calendar")}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {upcomingDeadlines.map((ev, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
            >
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="text-[11px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-mono">
                  {ev.date}
                </span>
                <span className="text-[11px] text-slate-500">
                  {ev.audience === "everyone" ? "All Salaried" : "Advance Tax"}
                </span>
              </div>
              <p className="font-bold text-slate-900 mt-1">{ev.title}</p>
              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                {ev.summary}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            downloadIcs(CALENDAR_EVENTS, "salaried-tax-deadlines.ics")
          }
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 p-2 rounded-xl transition-colors border border-purple-200/60"
        >
          <Calendar className="w-3.5 h-3.5" />
          Sync All Deadlines (.ics)
        </button>
      </div>

      {/* ── Widget 4: Quick Tool Shortcuts ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Quick Tools
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => onNavigateTool("hra")}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-left transition-colors"
          >
            <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800">Rent Receipts</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTool("offers")}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-left transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold text-slate-800">Offer Compare</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTool("retirals")}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-left transition-colors"
          >
            <PiggyBank className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-800">EPF & Gratuity</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTool("advanceTax")}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-left transition-colors"
          >
            <Zap className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-semibold text-slate-800">Advance Tax</span>
          </button>
        </div>
      </div>

      {/* ── Widget 5: Quick Profile Switcher ── */}
      {profiles.length > 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2.5">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Switch Profile
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSwitchProfile(p.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  p.id === activeProfile.id
                    ? "bg-blue-50 border-blue-400 text-blue-700 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
