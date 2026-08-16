import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Info, PiggyBank, TrendingUp } from "lucide-react";
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
import { calculateEpf, vpfThresholdPercent } from "../utils/epf";
import {
  EPF_INTEREST_RATE,
  EPS_MONTHLY_CAP,
  PF_TAXABLE_CONTRIBUTION_THRESHOLD,
  PF_WAGE_CEILING,
} from "../constants/payrollRules";
import { EpfInput, PfBasis } from "../types";
import { formatCurrency } from "../utils/format";

const DEFAULTS: Record<string, string> = {
  monthlyBasic: "",
  vpfPercent: "0",
  openingBalance: "",
  years: "25",
  annualIncrement: "8",
  interestRate: String(EPF_INTEREST_RATE),
};

/**
 * A stacked bar showing what proportion of the corpus was contributed against
 * what compounding added. This is a PART-TO-WHOLE chart of two parts, which is
 * the only case where a stacked bar is clearer than two separate ones - the
 * crossover point, where interest overtakes contributions, is the entire
 * argument for not withdrawing PF on every job change.
 */
function CorpusBar({
  contributed,
  interest,
}: {
  contributed: number;
  interest: number;
}) {
  const total = contributed + interest;
  if (total <= 0) return null;
  const share = (contributed / total) * 100;

  return (
    <div>
      <div
        className="h-5 w-full rounded-[4px] overflow-hidden flex"
        style={{ backgroundColor: "var(--viz-track)" }}
        aria-hidden="true"
      >
        <div
          className="h-full"
          style={{ width: `${share}%`, backgroundColor: "var(--viz-accent)" }}
        />
        <div
          className="h-full"
          style={{
            width: `${100 - share}%`,
            backgroundColor: "var(--ink-success)",
          }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5 text-[color:var(--ink-secondary)]">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: "var(--viz-accent)" }}
            aria-hidden="true"
          />
          Contributed {formatCurrency(contributed)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[color:var(--ink-secondary)]">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: "var(--ink-success)" }}
            aria-hidden="true"
          />
          Interest {formatCurrency(interest)}
        </span>
      </div>
    </div>
  );
}

export default function EpfCalculator() {
  const [form, setForm] = useState(DEFAULTS);
  const [employerBasis, setEmployerBasis] = useState<PfBasis>("ceiling");
  const [employeeBasis, setEmployeeBasis] = useState<PfBasis>("ceiling");

  const handleChange = useCallback((name: string, value: string) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  }, []);

  const input = useMemo<EpfInput>(
    () => ({
      monthlyBasic: Number(form.monthlyBasic) || 0,
      vpfPercent: Number(form.vpfPercent) || 0,
      employerBasis,
      employeeBasis,
      openingBalance: Number(form.openingBalance) || 0,
      years: Number(form.years) || 25,
      annualIncrement: Number(form.annualIncrement) || 0,
      interestRate: Number(form.interestRate) || EPF_INTEREST_RATE,
    }),
    [form, employerBasis, employeeBasis]
  );

  const result = useMemo(
    () => (input.monthlyBasic > 0 ? calculateEpf(input) : null),
    [input]
  );

  const vpfCeiling = useMemo(
    () => vpfThresholdPercent(input.monthlyBasic, employeeBasis),
    [input.monthlyBasic, employeeBasis]
  );

  return (
    <ToolLayout
      form={
        <Card
          title="Your provident fund"
          description="What goes in each month, and what it grows to."
        >
          <CurrencyField
            id="monthlyBasic"
            label="Monthly basic + DA"
            value={form.monthlyBasic}
            onChange={handleChange}
            placeholder="0"
            size="lead"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Select
              id="employeeBasis"
              label="Your contribution basis"
              value={employeeBasis}
              onChange={(value) => setEmployeeBasis(value as PfBasis)}
              hint={`Capped at the ₹${PF_WAGE_CEILING.toLocaleString("en-IN")} ceiling means ₹1,800 a month.`}
            >
              <option value="ceiling">Capped at the statutory ceiling</option>
              <option value="fullBasic">12% of full basic</option>
            </Select>
            <Select
              id="employerBasis"
              label="Employer's contribution basis"
              value={employerBasis}
              onChange={(value) => setEmployerBasis(value as PfBasis)}
              hint="Usually the same as yours, but not always."
            >
              <option value="ceiling">Capped at the statutory ceiling</option>
              <option value="fullBasic">12% of full basic</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <NumberField
              id="vpfPercent"
              label="Voluntary PF (VPF)"
              value={form.vpfPercent}
              onChange={handleChange}
              suffix="% of basic"
              max={88}
              hint={
                vpfCeiling > 0
                  ? `Above about ${vpfCeiling.toFixed(0)}% your interest starts being taxed.`
                  : "On top of the statutory 12%."
              }
            />
            <CurrencyField
              id="openingBalance"
              label="Balance already accumulated"
              value={form.openingBalance}
              onChange={handleChange}
              hint="From your EPFO passbook, including earlier employers."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <NumberField
              id="years"
              label="Years to project"
              value={form.years}
              onChange={handleChange}
              suffix="years"
              min={1}
              max={40}
            />
            <NumberField
              id="annualIncrement"
              label="Annual increment"
              value={form.annualIncrement}
              onChange={handleChange}
              suffix="%"
              max={50}
              decimal
            />
            <NumberField
              id="interestRate"
              label="Interest rate"
              value={form.interestRate}
              onChange={handleChange}
              suffix="%"
              max={15}
              decimal
              hint={`${EPF_INTEREST_RATE}% declared`}
            />
          </div>
        </Card>
      }
      result={
        result === null ? (
          <EmptyState
            icon={<PiggyBank className="w-6 h-6" />}
            title="Your corpus appears here"
          >
            Enter your monthly basic and the fund is projected forward — monthly
            contributions, the pension split and compounding, worked out as you
            type.
          </EmptyState>
        ) : (
          <HeroResult
            badge={`After ${input.years} years`}
            value={formatCurrency(result.corpus)}
            caption="provident fund corpus at withdrawal"
            footnote={
              <span
                className="font-semibold"
                style={{ color: "var(--ink-success)" }}
              >
                {formatCurrency(result.totalInterest)} of that is interest you
                never contributed
              </span>
            }
          >
            <div className="px-6 py-5 border-t border-slate-100">
              <CorpusBar
                contributed={result.totalContributed}
                interest={result.totalInterest}
              />
            </div>
            <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
              <StatRow
                label="Your PF, per month"
                value={formatCurrency(result.monthly.employee)}
              />
              {result.monthly.vpf > 0 && (
                <StatRow
                  label="Your VPF, per month"
                  value={formatCurrency(result.monthly.vpf)}
                />
              )}
              <StatRow
                label="Employer to PF"
                value={formatCurrency(result.monthly.employerEpf)}
              />
              <StatRow
                label="Employer to pension"
                value={formatCurrency(result.monthly.eps)}
                note="EPS — a pension, not part of the lump sum"
              />
              <StatRow
                label="Pension pot after the term"
                value={formatCurrency(result.epsTotal)}
                note="Excluded from the corpus above"
              />
            </dl>
          </HeroResult>
        )
      }
    >
      {result && result.taxableContribution > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-white p-5">
          <Note tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
            Your own contributions come to{" "}
            <strong>{formatCurrency(result.annualEmployeeContribution)}</strong>{" "}
            this year, which is{" "}
            <strong>{formatCurrency(result.taxableContribution)}</strong> over
            the {formatCurrency(PF_TAXABLE_CONTRIBUTION_THRESHOLD)} threshold.
            Interest on the excess — roughly{" "}
            {formatCurrency(result.taxableInterestFirstYear)} in the first year
            — is taxable at your slab rate, and the EPFO tracks it in a separate
            sub-account. Above this line VPF stops beating a plain deposit for a
            top-bracket taxpayer.
          </Note>
        </div>
      )}

      {result && (
        <FormSection
          title="Year by year"
          description="Contributions, interest and the closing balance"
          summary={`${result.rows.length} years to ${formatCurrency(result.corpus)}`}
          icon={<TrendingUp className="w-[18px] h-[18px]" />}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[color:var(--ink-muted)]">
                  <th scope="col" className="text-left font-medium pb-2">
                    Year
                  </th>
                  <th scope="col" className="text-right font-medium pb-2">
                    You
                  </th>
                  <th scope="col" className="text-right font-medium pb-2">
                    Employer
                  </th>
                  <th scope="col" className="text-right font-medium pb-2">
                    Interest
                  </th>
                  <th scope="col" className="text-right font-medium pb-2">
                    Closing
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.rows.map((row) => (
                  <tr key={row.year}>
                    <td className="py-2 pr-3 text-[color:var(--ink-secondary)]">
                      {row.year}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-800">
                      {formatCurrency(
                        row.employeeContribution + row.vpfContribution
                      )}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-800">
                      {formatCurrency(row.employerEpfContribution)}
                    </td>
                    <td
                      className="py-2 px-3 text-right tabular-nums"
                      style={{ color: "var(--ink-success)" }}
                    >
                      {formatCurrency(row.interest)}
                    </td>
                    <td className="py-2 pl-3 text-right tabular-nums font-medium text-slate-900">
                      {formatCurrency(row.closingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>
      )}

      <FormSection
        title="How the provident fund works"
        description="The split, the ceiling, and when interest becomes taxable"
        summary="The split, the ceiling, and when interest becomes taxable"
        icon={<Info className="w-[18px] h-[18px]" />}
      >
        <div className="text-sm space-y-3 text-[color:var(--ink-secondary)]">
          <p>
            <strong className="text-slate-900">The 12% is not symmetric.</strong>{" "}
            You contribute 12% and it all goes to the provident fund. Your
            employer also contributes 12%, but 8.33% of it is diverted to the
            pension scheme — frozen at{" "}
            {formatCurrency(EPS_MONTHLY_CAP)} a month, because EPS is always
            computed on the ceiling wage however large your basic.
          </p>
          <p>
            <strong className="text-slate-900">The ceiling is a choice.</strong>{" "}
            Employers may cap PF at the{" "}
            {formatCurrency(PF_WAGE_CEILING)} statutory wage — ₹1,800 a month
            each side — or run it on full basic. Full basic builds a much larger
            corpus and cuts your take-home; both are lawful.
          </p>
          <p>
            <strong className="text-slate-900">Taxable above ₹2.5 lakh.</strong>{" "}
            Since the Finance Act 2021, interest on your own contributions above{" "}
            {formatCurrency(PF_TAXABLE_CONTRIBUTION_THRESHOLD)} a year is
            taxable. Only your contributions count towards it, not your
            employer&apos;s — but VPF does, which is what usually causes the
            breach.
          </p>
          <p>
            <strong className="text-slate-900">Withdrawal.</strong> The corpus
            is tax-free after five years of continuous service, and transfers
            between employers preserve that clock. Withdrawing at a job change
            resets it and taxes the lot — which is what the interest half of the
            bar above really costs.
          </p>
          <p>
            <strong className="text-slate-900">Against the alternatives.</strong>{" "}
            VPF earns the EPF rate with no separate lock-in beyond the fund
            itself, against PPF&apos;s 15 years and its own ₹1.5 lakh annual
            ceiling. NPS may return more but is market-linked and locked until
            60. VPF is the simplest way to add to a guaranteed, tax-sheltered
            debt allocation — up to the ₹2.5 lakh line.
          </p>
        </div>
      </FormSection>
    </ToolLayout>
  );
}
