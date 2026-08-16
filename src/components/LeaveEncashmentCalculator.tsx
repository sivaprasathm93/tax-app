import { useCallback, useMemo, useState } from "react";
import { CalendarCheck, Info, Plane } from "lucide-react";
import { CurrencyField } from "./CurrencyField";
import { FormSection } from "./FormSection";
import { Select } from "./Select";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { HeroResult } from "./ui/HeroResult";
import { Note } from "./ui/Note";
import { NumberField } from "./ui/NumberField";
import { StatRow } from "./ui/StatRow";
import { ToolLayout } from "./ui/ToolLayout";
import { calculateLeaveEncashment } from "../utils/leaveEncashment";
import {
  LEAVE_AVERAGING_MONTHS,
  LEAVE_DAYS_PER_YEAR_LIMIT,
  LEAVE_ENCASHMENT_CEILING,
} from "../constants/separationRules";
import { EmployerKind, LeaveEncashmentInput } from "../types";
import { formatCurrency } from "../utils/format";

const EMPTY: Record<string, string> = {
  monthlySalary: "",
  yearsOfService: "",
  leaveDaysEncashed: "",
  leaveDaysPerYear: "",
  amountReceived: "",
  previouslyExempted: "",
};

export default function LeaveEncashmentCalculator() {
  const [form, setForm] = useState(EMPTY);
  const [employerKind, setEmployerKind] = useState<EmployerKind>("private");

  const handleChange = useCallback((name: string, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const input = useMemo<LeaveEncashmentInput>(
    () => ({
      employerKind,
      monthlySalary: Number(form.monthlySalary) || 0,
      yearsOfService: Number(form.yearsOfService) || 0,
      leaveDaysEncashed: Number(form.leaveDaysEncashed) || 0,
      leaveDaysPerYear: Number(form.leaveDaysPerYear) || 0,
      amountReceived: Number(form.amountReceived) || 0,
      previouslyExempted: Number(form.previouslyExempted) || 0,
    }),
    [form, employerKind]
  );

  const result = useMemo(
    () =>
      input.monthlySalary > 0 && input.leaveDaysEncashed > 0
        ? calculateLeaveEncashment(input)
        : null,
    [input]
  );

  const received =
    input.amountReceived > 0
      ? input.amountReceived
      : (result?.perDaySalary ?? 0) * input.leaveDaysEncashed;

  const daysTrimmed =
    result !== null && input.leaveDaysEncashed > result.eligibleDays;

  return (
    <ToolLayout
      form={
        <Card
          title="Leave encashed on leaving"
          description="What your employer pays for unused leave, and how much of it is tax-free."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyField
              id="monthlySalary"
              label="Average monthly basic + DA"
              value={form.monthlySalary}
              onChange={handleChange}
              placeholder="0"
              hint={`Averaged over your last ${LEAVE_AVERAGING_MONTHS} months.`}
            />
            <NumberField
              id="leaveDaysEncashed"
              label="Leave days encashed"
              value={form.leaveDaysEncashed}
              onChange={handleChange}
              suffix="days"
              max={2000}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <NumberField
              id="yearsOfService"
              label="Completed years of service"
              value={form.yearsOfService}
              onChange={handleChange}
              suffix="years"
              max={60}
              hint={`The statute counts ${LEAVE_DAYS_PER_YEAR_LIMIT} days a year, whatever your employer allows.`}
            />
            <Select
              id="employerKind"
              label="Type of employer"
              value={employerKind}
              onChange={(value) => setEmployerKind(value as EmployerKind)}
              hint="Government leave encashment is exempt without limit."
            >
              <option value="private">Private sector</option>
              <option value="government">Government</option>
            </Select>
          </div>

          {daysTrimmed && (
            <div className="mt-4">
              <Note tone="warn" icon={<Info className="w-3.5 h-3.5" />}>
                You are encashing {input.leaveDaysEncashed} days, but{" "}
                {input.yearsOfService} years of service only entitles you to{" "}
                {result?.eligibleDays} days under the statute — 30 a year. The
                balance is paid, it simply is not sheltered.
              </Note>
            </div>
          )}
        </Card>
      }
      result={
        result === null ? (
          <EmptyState
            icon={<Plane className="w-6 h-6" />}
            title="Your exemption appears here"
          >
            Enter your average monthly basic and the leave days being encashed —
            section 10(10AA) takes the least of four limbs, all shown as you
            type.
          </EmptyState>
        ) : (
          <HeroResult
            badge={result.fullyExempt ? "Entirely tax-free" : "Tax-free"}
            badgeTone={result.fullyExempt ? "good" : "neutral"}
            value={formatCurrency(result.exempt)}
            caption="exempt under section 10(10AA)"
            footnote={
              result.taxable > 0 ? (
                <span className="font-medium text-amber-800">
                  {formatCurrency(result.taxable)} is taxable as salary
                </span>
              ) : (
                <span
                  className="font-semibold"
                  style={{ color: "var(--ink-success)" }}
                >
                  Nothing to pay on this
                </span>
              )
            }
          >
            <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
              <StatRow
                label="Encashment received"
                value={formatCurrency(received)}
              />
              <StatRow
                label="Salary per day"
                value={formatCurrency(result.perDaySalary)}
                note="Monthly salary ÷ 30"
              />
              <StatRow
                label="Days the statute counts"
                value={`${result.eligibleDays} days`}
              />
            </dl>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <p className="text-xs text-[color:var(--ink-muted)]">
                Bound by <strong className="text-slate-700">{result.boundBy}</strong>{" "}
                — the smallest of the four limbs below.
              </p>
            </div>
          </HeroResult>
        )
      }
    >
      {result && !result.fullyExempt && (
        <FormSection
          title="The four limbs"
          description="Section 10(10AA)(ii) exempts the least of these"
          summary={`Bound by ${result.boundBy.toLowerCase()}`}
          icon={<CalendarCheck className="w-[18px] h-[18px]" />}
          defaultOpen
        >
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {result.limbs.map((limb) => {
                const binding = limb.label === result.boundBy;
                return (
                  <tr key={limb.label} className={binding ? "bg-blue-50/60" : ""}>
                    <td className="py-2.5 pr-3">
                      <span
                        className={
                          binding
                            ? "font-semibold text-slate-900"
                            : "text-[color:var(--ink-secondary)]"
                        }
                      >
                        {limb.label}
                      </span>
                      {limb.note && (
                        <span className="block text-xs text-[color:var(--ink-muted)]">
                          {limb.note}
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2.5 pl-3 text-right tabular-nums whitespace-nowrap ${
                        binding
                          ? "font-semibold text-slate-900"
                          : "text-slate-800"
                      }`}
                    >
                      {formatCurrency(limb.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </FormSection>
      )}

      <FormSection
        title="If your payout differs"
        description="Enter the actual figure, and any exemption used at an earlier employer"
        summary="Actual payout, and exemption already used elsewhere"
        icon={<Plane className="w-[18px] h-[18px]" />}
      >
        <CurrencyField
          id="amountReceived"
          label="Leave encashment actually received"
          value={form.amountReceived}
          onChange={handleChange}
          hint="Leave blank to compute it from your salary and leave days."
        />
        <CurrencyField
          id="previouslyExempted"
          label="Exemption already claimed at earlier employers"
          value={form.previouslyExempted}
          onChange={handleChange}
          hint={`The ${formatCurrency(LEAVE_ENCASHMENT_CEILING)} ceiling is a lifetime total, not a fresh allowance per job.`}
        />
      </FormSection>

      <FormSection
        title="How leave encashment is taxed"
        description="Section 10(10AA), and the ceiling raised to ₹25 lakh"
        summary="Section 10(10AA), and the ceiling raised to ₹25 lakh"
        icon={<Info className="w-[18px] h-[18px]" />}
      >
        <div className="text-sm space-y-3 text-[color:var(--ink-secondary)]">
          <p>
            <strong className="text-slate-900">Only on leaving.</strong> This
            exemption applies to encashment at retirement or resignation. Leave
            encashed while you are still employed is fully taxable salary,
            whatever your employer calls it.
          </p>
          <p>
            <strong className="text-slate-900">Thirty days a year.</strong> The
            third limb is the one that surprises people. However generous your
            employer&apos;s accrual policy, the statute credits a maximum of{" "}
            {LEAVE_DAYS_PER_YEAR_LIMIT} days per completed year of service.
          </p>
          <p>
            <strong className="text-slate-900">₹25 lakh, once.</strong> The
            ceiling rose from ₹3,00,000 to{" "}
            {formatCurrency(LEAVE_ENCASHMENT_CEILING)} for non-government
            employees. It is a lifetime aggregate across every employer — a
            second encashment gets only what the first left behind.
          </p>
          <p>
            <strong className="text-slate-900">Both regimes.</strong> Unlike HRA
            and LTA, this exemption survives under section 115BAC. Choosing the
            new regime does not cost you it.
          </p>
        </div>
      </FormSection>
    </ToolLayout>
  );
}
