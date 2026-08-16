import { RentDetails, RentReceipt } from "../../types";
import { formatCurrency } from "../../utils/format";

interface Props {
  details: RentDetails;
  receipts: RentReceipt[];
}

/** Rupees in words - HR portals reject receipts that omit it. */
function amountInWords(amount: number): string {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const twoDigits = (value: number): string =>
    value < 20
      ? ones[value]
      : `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ""}`;

  const whole = Math.round(Math.max(0, amount));
  if (whole === 0) return "Zero";

  // The Indian system groups as crore, lakh, thousand, hundred - not millions.
  const parts: string[] = [];
  const units: { divisor: number; name: string }[] = [
    { divisor: 10000000, name: "Crore" },
    { divisor: 100000, name: "Lakh" },
    { divisor: 1000, name: "Thousand" },
    { divisor: 100, name: "Hundred" },
  ];

  let remaining = whole;
  for (const unit of units) {
    const count = Math.floor(remaining / unit.divisor);
    if (count > 0) {
      parts.push(`${twoDigits(count)} ${unit.name}`);
      remaining %= unit.divisor;
    }
  }
  if (remaining > 0) {
    parts.push(`${parts.length > 0 ? "and " : ""}${twoDigits(remaining)}`);
  }

  return parts.join(" ");
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-[130px] shrink-0 text-black/70">{label}</span>
      <span className="font-medium border-b border-dotted border-black/40 flex-1">
        {value || " "}
      </span>
    </div>
  );
}

/**
 * One receipt per page, in the layout HR portals expect: the revenue stamp
 * box, the landlord's PAN where the year's rent needs it, and a signature
 * line. The receipt is the landlord's document, so nothing here is
 * pre-signed - the box is left for a physical signature over the stamp,
 * which is what makes it acceptable as evidence.
 */
export function RentReceiptSheet({ details, receipts }: Props) {
  const annualRent = details.monthlyRent * details.months;
  const panNeeded = annualRent > 100000;

  return (
    <>
      {receipts.map((receipt) => (
        <article
          key={receipt.index}
          className="print-page text-[11pt] leading-relaxed text-black"
        >
          <div className="border-2 border-black p-6">
            <header className="text-center border-b border-black pb-3">
              <h1 className="text-[18pt] font-bold tracking-wide">
                RENT RECEIPT
              </h1>
              <p className="text-[9pt] mt-0.5">
                Receipt {receipt.index} of {receipts.length} · For submission
                under section 10(13A) of the Income-tax Act
              </p>
            </header>

            <div className="flex justify-between mt-4 text-[10pt]">
              <span>
                <span className="text-black/70">Receipt no.</span>{" "}
                <span className="font-medium">
                  {String(receipt.index).padStart(3, "0")}
                </span>
              </span>
              <span>
                <span className="text-black/70">Date</span>{" "}
                <span className="font-medium">{receipt.issuedOn}</span>
              </span>
            </div>

            <p className="mt-5 text-[12pt]">
              Received with thanks a sum of{" "}
              <strong className="whitespace-nowrap">
                {formatCurrency(receipt.amount)}
              </strong>{" "}
              (Rupees {amountInWords(receipt.amount)} only) from{" "}
              <strong>{details.tenantName || "____________________"}</strong>{" "}
              towards rent for the period{" "}
              <strong>{receipt.period}</strong> in respect of the property
              described below.
            </p>

            <div className="mt-5 space-y-2 text-[10.5pt]">
              <Field label="Tenant" value={details.tenantName} />
              <Field label="Property let" value={details.rentalAddress} />
              <Field label="Period" value={receipt.period} />
              <Field
                label="Rent received"
                value={`${formatCurrency(receipt.amount)}`}
              />
            </div>

            <div className="mt-5 pt-3 border-t border-black/40 space-y-2 text-[10.5pt]">
              <p className="font-semibold text-[10pt] uppercase tracking-wider">
                Landlord
              </p>
              <Field label="Name" value={details.landlordName} />
              <Field label="Address" value={details.landlordAddress} />
              <Field
                label="PAN"
                value={
                  details.landlordPan ||
                  (panNeeded ? "" : "Not required — rent under ₹1,00,000 a year")
                }
              />
              {panNeeded && !details.landlordPan && (
                <p className="text-[9pt] italic">
                  Annual rent exceeds ₹1,00,000, so the landlord&apos;s PAN must
                  be stated here — or a signed declaration of non-availability
                  attached in its place.
                </p>
              )}
            </div>

            <div className="mt-8 flex items-end justify-between gap-8">
              {/* A revenue stamp is required once a cash receipt crosses
                  ₹5,000 under the Indian Stamp Act; the box is left empty for
                  a physical stamp and a signature across it. */}
              <div className="text-center">
                <div className="w-[110px] h-[70px] border border-dashed border-black/60 grid place-items-center text-[8pt] text-black/60 leading-tight px-2">
                  Affix ₹1<br />
                  revenue stamp
                </div>
                <p className="text-[8pt] mt-1 text-black/60">
                  Required above ₹5,000 in cash
                </p>
              </div>

              <div className="text-center">
                <div className="w-[200px] border-b border-black h-12" />
                <p className="text-[9pt] mt-1">
                  Signature of the landlord
                </p>
                <p className="text-[9pt] font-medium">
                  {details.landlordName || " "}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[8pt] text-black/60">
            Generated locally in the browser. No rent, PAN or address data was
            transmitted anywhere.
          </p>
        </article>
      ))}
    </>
  );
}
