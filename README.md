# Tax App

Two calculators for Indian salaried employees, **FY 2026-27 (A.Y. 2027-28)**:

- **Income tax** — enter your salary and deductions once and see the old and new
  regimes side by side, with a full slab-wise breakdown of how each number was
  reached. Rules from the **Income-tax Act, 2025** and the **Income-tax Rules,
  2026**, both in force from 1 April 2026.
- **Gratuity** — what you are owed on leaving and how much of it is tax-free,
  under the **Code on Social Security, 2020**, in force since 21 November 2025.

Both work out their answer as you type; there is no calculate button.

## Income tax

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

## Gratuity

**Formula** — `(wages × 15 × completed years) ÷ 26` for employers covered by the
statute, `÷ 30` for those outside it. Covered employers round a trailing
part-year up once it exceeds six months (s.4(2)); outside the statute
s.10(10)(iii) counts only completed years, so the remainder is dropped.

**The 50% wage floor** — the new codes require wages to be at least half of total
remuneration, so a salary structured with a thin basic gets lifted to that floor
before gratuity is worked out. This is the change that raises most payouts, so
enter your CTC to see it apply.

**Eligibility** — five years of continuous service, cut to **one year for
fixed-term staff** under the new codes, and waived entirely on death or
disablement.

**Ceiling and tax** — ₹20L statutory ceiling. Under s.10(10), government service
is exempt without limit; for everyone else the exemption is the least of what was
received, the statutory formula, and ₹20L — the ₹20L being a *lifetime* total
across employers, not per employer. Anything paid above that is taxable salary.

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
  components/      UI components (form fields, breakdown, slab tables, help panel,
                   gratuity calculator)
  constants/       taxRules.ts / gratuityRules.ts — every statutory rate,
                   ceiling and threshold
  utils/           taxCalculator.ts / gratuityCalculator.ts (the engines)
                   and format.ts
  types.ts         shared types
  App.tsx          tool switching and page layout
```

All statutory figures live in `src/constants/`, so next year's budget should
mostly be a one-file change.

## Contributing

Contributions are welcome — please open an issue or a pull request.

## License

MIT. See the LICENSE file for details.

Made with ❤️ for tax payers by Sivaprasath
