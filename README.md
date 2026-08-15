# Tax App

An Indian income tax calculator for **FY 2026-27 (A.Y. 2027-28)**. Enter your salary
and deductions once and see the old and new regimes side by side, with a full
slab-wise breakdown of how each number was reached.

Rules are those of the **Income-tax Act, 2025** and the **Income-tax Rules, 2026**,
both in force from 1 April 2026.

## What it covers

**New regime** — slabs of 0 / 5 / 10 / 15 / 20 / 25 / 30% across ₹4L bands up to
₹24L, ₹75,000 standard deduction, and the ₹60,000 section 87A rebate up to ₹12L
of taxable income with marginal relief just above that line.

**Old regime** — age-based basic exemption (₹2.5L / ₹3L for senior citizens /
₹5L for super senior citizens), ₹50,000 standard deduction, and the ₹12,500
section 87A rebate up to ₹5L.

**Meal vouchers** — Rule 15(5)(a) raised the exempt value from ₹50 to **₹200 per
meal** from 1 April 2026 and made it available under **both** regimes for the
first time. At 2 meals × 22 days × 12 months that is **₹1,05,600** a year, up
from ₹26,400. Only non-transferable vouchers and food cards qualify; a cash meal
allowance stays fully taxable.

**HRA** — the least of actual HRA, rent minus 10% of basic, and 50% (metro) or
40% (non-metro) of basic. Bengaluru, Pune, Hyderabad and Ahmedabad joined the
50% metro list on 1 April 2026.

**Employer NPS — 80CCD(2)** — allowed in both regimes, at 14% of basic + DA under
the new regime and 10% under the old.

**Other old-regime deductions** — 80C, 80CCD(1B), 80D, 24(b), 80TTA/80TTB and
professional tax, each capped at its statutory ceiling.

**Surcharge and cess** — 10 / 15 / 25 / 37% above ₹50L / ₹1Cr / ₹2Cr / ₹5Cr under
the old regime, capped at 25% under the new, with marginal relief at every
threshold, plus 4% Health & Education Cess.

Salaried income only — capital gains, business income and other special-rate
income are not modelled.

## Getting started

```bash
git clone https://github.com/sivaprasathm93/tax-app.git
cd tax-app
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Tech

React 18 + TypeScript, Vite and Tailwind CSS, with `lucide-react` for icons.
There are no runtime services or trackers — the app is fully static and every
calculation happens in the browser.

## Project structure

```
src/
  components/      UI components (form field, breakdown, slab tables, help panel)
  constants/       taxRules.ts — every statutory rate, ceiling and threshold
  utils/           taxCalculator.ts (the engine) and format.ts
  types.ts         shared types
  App.tsx          the form and page layout
```

All statutory figures live in `src/constants/taxRules.ts`, so next year's budget
should mostly be a one-file change.

## Contributing

Contributions are welcome — please open an issue or a pull request.

## License

MIT. See the LICENSE file for details.

Made with ❤️ for tax payers by Sivaprasath
