import { useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Download,
  FileText,
  Home,
  Info,
  Sparkles,
} from "lucide-react";
import { CurrencyField } from "./CurrencyField";
import { FormSection } from "./FormSection";
import { Select } from "./Select";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { HeroResult } from "./ui/HeroResult";
import { Note } from "./ui/Note";
import { NumberField } from "./ui/NumberField";
import { StatRow } from "./ui/StatRow";
import { TextField } from "./ui/TextField";
import { ToolLayout } from "./ui/ToolLayout";
import { RentReceiptSheet } from "./print/RentReceiptSheet";
import { usePrint } from "../state/printContext";
import { useProfile } from "../state/profileContext";
import {
  LANDLORD_PAN_THRESHOLD,
  buildReceipts,
  computeHraDetail,
  isValidPan,
  receiptsTotal,
} from "../utils/hra";
import { priceAllowances, totalRestructuringSaving } from "../utils/salaryStructure";
import { calculateTaxComparison } from "../utils/taxCalculator";
import { METRO_CITIES } from "../constants/taxRules";
import {
  HraResult,
  ReceiptFrequency,
  RentDetails,
  TaxInput,
} from "../types";
import { formatCurrency } from "../utils/format";

const LIMB_EXPLANATION: Record<HraResult["limitedBy"], string> = {
  hra: "Capped by the HRA your employer actually pays — asking payroll to raise the HRA share of your salary is the only lever left.",
  rent: "Capped by rent less 10% of basic. Every extra rupee of rent you pay raises the exemption one for one, until another limb binds.",
  salary:
    "Capped at the statutory share of basic. Neither more rent nor more HRA helps — only a higher basic will.",
  none: "",
};

export default function HraAndDocuments({ input }: { input: TaxInput }) {
  const { profile, update } = useProfile();
  const { print, printing } = usePrint();
  const rent = profile.rent;

  const setRent = useCallback(
    (patch: Partial<RentDetails>) => update({ rent: { ...rent, ...patch } }),
    [rent, update]
  );

  const handleRentText = useCallback(
    (name: string, value: string) => setRent({ [name]: value }),
    [setRent]
  );

  const handleRentMoney = useCallback(
    (name: string, value: string) =>
      setRent({ [name]: value === "" ? 0 : Number(value) }),
    [setRent]
  );

  const hra = useMemo(
    () =>
      computeHraDetail(
        input.hraReceived,
        input.rentPaid,
        input.basicSalary,
        input.cityType
      ),
    [input.hraReceived, input.rentPaid, input.basicSalary, input.cityType]
  );

  const receipts = useMemo(() => buildReceipts(rent), [rent]);
  const declaredTotal = receiptsTotal(receipts);

  // The advisor prices allowances against whichever regime the taxpayer is
  // heading for - restructuring advice for the old regime is close to useless
  // to someone the new regime already suits.
  const regime = useMemo(() => {
    if (input.grossIncome <= 0) return "new" as const;
    return calculateTaxComparison(input).betterRegime === "old"
      ? ("old" as const)
      : ("new" as const);
  }, [input]);

  const savings = useMemo(
    () => (input.grossIncome > 0 ? priceAllowances(input, regime) : []),
    [input, regime]
  );
  const totalSaving = useMemo(
    () =>
      input.grossIncome > 0
        ? totalRestructuringSaving(input, regime, savings)
        : 0,
    [input, regime, savings]
  );
  const columnTotal = savings.reduce((total, item) => total + item.taxSaved, 0);

  const panMissing = rent.monthlyRent * rent.months > LANDLORD_PAN_THRESHOLD &&
    rent.landlordPan.trim() === "";
  const panMalformed =
    rent.landlordPan.trim() !== "" && !isValidPan(rent.landlordPan);

  // Rent typed on this tab is the more considered figure, so it is the one
  // pushed back to the income tax form rather than the other way round.
  const rentMismatch =
    declaredTotal > 0 &&
    input.rentPaid > 0 &&
    Math.abs(declaredTotal - input.rentPaid) > 1;

  const handleDownload = useCallback(() => {
    print(
      <RentReceiptSheet details={rent} receipts={receipts} />,
      `Rent receipts - ${rent.tenantName || "tenant"}`
    );
  }, [print, rent, receipts]);

  return (
    <ToolLayout
      form={
        <Card
          title="Rent receipts"
          description="Filled in once, printed as a set your HR portal will accept."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="tenantName"
              label="Your name (tenant)"
              value={rent.tenantName}
              onChange={handleRentText}
              placeholder="As it appears in payroll"
            />
            <TextField
              id="landlordName"
              label="Landlord's name"
              value={rent.landlordName}
              onChange={handleRentText}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <CurrencyField
              id="monthlyRent"
              label="Monthly rent"
              value={rent.monthlyRent === 0 ? "" : String(rent.monthlyRent)}
              onChange={handleRentMoney}
              placeholder="0"
            />
            <TextField
              id="landlordPan"
              label="Landlord's PAN"
              value={rent.landlordPan}
              onChange={handleRentText}
              uppercase
              maxLength={10}
              placeholder="ABCDE1234F"
              invalid={panMalformed}
              invalidHint="A PAN is five letters, four digits and a letter."
              hint={
                panMissing
                  ? "Required — annual rent is over ₹1,00,000."
                  : "Needed once the year's rent crosses ₹1,00,000."
              }
            />
          </div>

          <div className="mt-4">
            <TextField
              id="rentalAddress"
              label="Address of the rented property"
              value={rent.rentalAddress}
              onChange={handleRentText}
              multiline
            />
          </div>

          <div className="mt-4">
            <TextField
              id="landlordAddress"
              label="Landlord's address"
              value={rent.landlordAddress}
              onChange={handleRentText}
              multiline
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label
                htmlFor="fromMonth"
                className="block text-[13px] font-medium text-slate-700 mb-1.5"
              >
                First month
              </label>
              <input
                id="fromMonth"
                type="month"
                value={rent.fromMonth}
                onChange={(event) => setRent({ fromMonth: event.target.value })}
                className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3 text-base
                           text-slate-900 hover:border-slate-400 focus:border-blue-500
                           focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-colors"
              />
            </div>
            <NumberField
              id="months"
              label="Months to cover"
              value={String(rent.months)}
              onChange={(_, value) =>
                setRent({ months: value === "" ? 0 : Number(value) })
              }
              max={36}
              suffix="months"
            />
            <Select
              id="frequency"
              label="Receipt frequency"
              value={rent.frequency}
              onChange={(value) =>
                setRent({ frequency: value as ReceiptFrequency })
              }
            >
              <option value="monthly">Monthly — 12 receipts</option>
              <option value="quarterly">Quarterly — 4 receipts</option>
            </Select>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={receipts.length === 0 || printing}
            className="no-print mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl
                       bg-blue-600 px-4 py-3 text-sm font-semibold text-white
                       hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400
                       focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30
                       transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            {receipts.length === 0
              ? "Enter a monthly rent to generate receipts"
              : `Download ${receipts.length} receipt${receipts.length === 1 ? "" : "s"} as PDF`}
          </button>
          <p className="no-print mt-2 text-xs text-[color:var(--ink-muted)] text-center">
            Opens your browser&apos;s print dialog — choose “Save as PDF”. The
            file is written by your browser; nothing is uploaded.
          </p>

          {panMissing && (
            <div className="mt-4">
              <Note tone="warn" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                Rent for the period comes to{" "}
                {formatCurrency(declaredTotal)}, over the{" "}
                {formatCurrency(LANDLORD_PAN_THRESHOLD)} threshold. Without the
                landlord&apos;s PAN your employer must refuse the exemption —
                and you would have to claim it back at filing instead.
              </Note>
            </div>
          )}

          {rentMismatch && (
            <div className="mt-4">
              <Note tone="info" icon={<Info className="w-3.5 h-3.5" />}>
                These receipts total {formatCurrency(declaredTotal)}, but the
                income tax tab has {formatCurrency(input.rentPaid)} as rent
                paid. Your declaration and your proofs need to agree.
              </Note>
            </div>
          )}
        </Card>
      }
      result={
        hra.exemption <= 0 ? (
          <EmptyState icon={<Home className="w-6 h-6" />} title="Your HRA exemption appears here">
            It needs three figures from the income tax tab: HRA received, rent
            paid and basic salary. All three must be present — section 10(13A)
            takes the least of them.
          </EmptyState>
        ) : (
          <HeroResult
            badge="Tax-free"
            value={formatCurrency(hra.exemption)}
            caption="HRA exempt under section 10(13A)"
            footnote={
              hra.taxable > 0 ? (
                <span className="font-medium text-amber-800">
                  {formatCurrency(hra.taxable)} of your HRA stays taxable
                </span>
              ) : (
                <span
                  className="font-semibold"
                  style={{ color: "var(--ink-success)" }}
                >
                  Your entire HRA is exempt
                </span>
              )
            }
          >
            <dl className="px-6 py-3 border-t border-slate-100 divide-y divide-slate-100">
              <StatRow
                label="HRA received"
                value={formatCurrency(hra.actualHra)}
                strong={hra.limitedBy === "hra"}
              />
              <StatRow
                label="Rent less 10% of basic"
                value={formatCurrency(hra.rentLessTenPercent)}
                strong={hra.limitedBy === "rent"}
              />
              <StatRow
                label={`${input.cityType === "metro" ? "50" : "40"}% of basic`}
                value={formatCurrency(hra.percentOfSalary)}
                note={input.cityType === "metro" ? "Metro rate" : "Non-metro rate"}
                strong={hra.limitedBy === "salary"}
              />
            </dl>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <p className="text-xs text-[color:var(--ink-muted)]">
                {LIMB_EXPLANATION[hra.limitedBy]}
              </p>
            </div>
          </HeroResult>
        )
      }
    >
      <FormSection
        title="Restructure your salary"
        description="Tax-free components you could ask payroll to carve out"
        summary={
          totalSaving > 0
            ? `Up to ${formatCurrency(totalSaving)} a year in tax`
            : "Meal card, telephone, books, employer NPS, LTA"
        }
        icon={<Sparkles className="w-[18px] h-[18px]" />}
        accent
      >
        {input.grossIncome <= 0 ? (
          <p className="text-sm text-[color:var(--ink-secondary)]">
            Enter your gross salary on the income tax tab and each component is
            priced against your actual position.
          </p>
        ) : (
          <>
            <Note tone="good" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Priced against the <strong>{regime === "new" ? "new" : "old"}</strong>{" "}
              regime — the one that currently costs you less. Each figure is the
              whole computation run twice, with and without the component, so a
              rebate or surcharge threshold in your way is already accounted
              for.
            </Note>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-[color:var(--ink-muted)]">
                  <th scope="col" className="text-left font-medium pb-2">
                    Component
                  </th>
                  <th scope="col" className="text-right font-medium pb-2">
                    Headroom
                  </th>
                  <th scope="col" className="text-right font-medium pb-2">
                    Tax saved
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savings.map(({ option, amount, taxSaved }) => (
                  <tr key={option.id}>
                    <td className="py-2.5 pr-3">
                      <span className="text-slate-900 font-medium">
                        {option.label}
                      </span>
                      <span className="block text-xs text-[color:var(--ink-muted)]">
                        {option.authority}
                        {!option.bothRegimes && " · old regime only"}
                      </span>
                      <span className="block text-xs text-[color:var(--ink-secondary)] mt-0.5">
                        {option.requirement}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 align-top whitespace-nowrap">
                      {amount > 0 ? formatCurrency(amount) : "—"}
                    </td>
                    <td
                      className="py-2.5 pl-3 text-right tabular-nums font-semibold align-top whitespace-nowrap"
                      style={
                        taxSaved > 0
                          ? { color: "var(--ink-success)" }
                          : undefined
                      }
                    >
                      {taxSaved > 0 ? formatCurrency(taxSaved) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalSaving > 0 && (
              <Note tone="good" icon={<Sparkles className="w-3.5 h-3.5" />}>
                Taking up everything available saves{" "}
                <strong>{formatCurrency(totalSaving)}</strong> a year.
                {/* Only worth explaining when the two figures actually differ,
                    which happens when the combined relief crosses a slab. */}
                {totalSaving < columnTotal - 1 && (
                  <>
                    {" "}
                    That is computed on the combined position, so it is less
                    than the column adds up to — taking all of them drops you
                    into a lower slab, at which point the last few are worth
                    less than they are priced at on their own.
                  </>
                )}
              </Note>
            )}

            <Note tone="info" icon={<Info className="w-3.5 h-3.5" />}>
              None of this changes what your employer spends. It moves money
              from special allowance, which is fully taxable, into components
              that are not — so it needs payroll to reissue your salary
              structure, usually only at the start of a financial year.
            </Note>
          </>
        )}
      </FormSection>

      <FormSection
        title="How HRA is worked out"
        description="Section 10(13A) with Rule 2A, and the metro list from 1 April 2026"
        summary="Section 10(13A) with Rule 2A, and the metro list from 1 April 2026"
        icon={<FileText className="w-[18px] h-[18px]" />}
      >
        <div className="text-sm space-y-3 text-[color:var(--ink-secondary)]">
          <p>
            <strong className="text-slate-900">The least of three.</strong> The
            exemption is the smallest of the HRA you actually receive, the rent
            you pay less 10% of basic, and{" "}
            {input.cityType === "metro" ? "50%" : "40%"} of basic. Whichever is
            smallest is the one to attack — the panel above names it.
          </p>
          <p>
            <strong className="text-slate-900">Metro cities.</strong> From 1
            April 2026 the 50% list is {METRO_CITIES.join(", ")}. Bengaluru,
            Pune, Hyderabad and Ahmedabad were added — if your employer still
            has you at 40%, that is worth raising.
          </p>
          <p>
            <strong className="text-slate-900">The PAN rule.</strong> Once the
            year&apos;s rent crosses{" "}
            {formatCurrency(LANDLORD_PAN_THRESHOLD)} you must give your employer
            the landlord&apos;s PAN. If the landlord genuinely has none, a
            signed declaration to that effect goes in its place.
          </p>
          <p>
            <strong className="text-slate-900">Old regime only.</strong> Section
            115BAC withdraws the HRA exemption under the new regime. If the new
            regime is cheaper for you overall, none of this changes that — but
            it is why the breakeven on the income tax tab matters.
          </p>
          <p>
            <strong className="text-slate-900">Paying rent to family.</strong>{" "}
            Allowed, and routinely upheld, provided the rent is genuinely paid,
            the recipient owns the property and declares the income. Paying rent
            to a spouse for a jointly occupied home is the arrangement that gets
            struck down.
          </p>
        </div>
      </FormSection>
    </ToolLayout>
  );
}
