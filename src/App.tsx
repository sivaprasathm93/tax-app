import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { Calculator, HelpCircle, Heart } from "lucide-react";
import { calculateTaxComparison } from "./utils/taxCalculator";
import { TaxBreakdown } from "./components/TaxBreakdown";
import { ComparisonResult } from "./types";
import theme from "./theme";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { analytics } from "./firebase";
import { Box, List, ListItem, ListItemText, Typography } from "@mui/material";

function App() {
  const [income, setIncome] = useState<string>("");
  const [hra, setHra] = useState<string>("");
  const [nps, setNps] = useState<string>("");
  const [eightyC, setEightyC] = useState<string>("");
  const [lossOnHomeLoan, setLossOnHomeLoan] = useState<string>("");
  const [eightyD, setEightyD] = useState<string>("");
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const [visitCount, setVisitCount] = useState<number>(0);

  useEffect(() => {
    const incrementVisitCount = async () => {
      const visitDocRef = doc(analytics, "visits", "totalVisits");
      const visitDoc = await getDoc(visitDocRef);

      if (visitDoc.exists()) {
        const currentCount = visitDoc.data()?.count || 0;
        await updateDoc(visitDocRef, { count: currentCount + 1 });
        setVisitCount(currentCount + 1);
      } else {
        await setDoc(visitDocRef, { count: 1 });
        setVisitCount(1);
      }
    };

    incrementVisitCount();
  }, []);

  const handleCalculate = () => {
    const incomeValue = parseFloat(income.replace(/,/g, ""));
    const eightyCValue = parseFloat(eightyC.replace(/,/g, ""));
    const eightyDValue = parseFloat(eightyD.replace(/,/g, ""));
    const lossOnHomeLoanValue = parseFloat(lossOnHomeLoan.replace(/,/g, ""));
    const npsValue = parseFloat(nps.replace(/,/g, ""));
    const hraValue = parseFloat(hra.replace(/,/g, ""));
    if (!isNaN(incomeValue)) {
      if (eightyCValue > 150000) {
        alert("80C value should be less than or equal to 1,50,000");
        return;
      }
      if (eightyDValue > 50000) {
        alert("80D value should be less than or equal to 50,000");
        return;
      }
      if (lossOnHomeLoanValue > 200000) {
        alert("24b value should be less than or equal to 2,00,000");
        return;
      }
      if (npsValue > 50000) {
        alert("NPS value should be less than or equal to 50,000");
        return;
      }
      const result = calculateTaxComparison(
        incomeValue,
        hraValue,
        npsValue,
        eightyCValue,
        lossOnHomeLoanValue,
        eightyDValue
      );
      setComparison(result);
    }
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, "");
    setIncome(value);
  };

  const handleHraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, "");
    setHra(value);
  };

  const handleNpsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, "");
    setNps(value);
  };

  const handleEightyCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, "");
    setEightyC(value);
  };

  const handleLossOnHomeLoanChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/[^\d,]/g, "");
    setLossOnHomeLoan(value);
  };

  const handleEightyDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d,]/g, "");
    setEightyD(value);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6 sm:py-12 px-4 flex flex-col">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 flex-grow">
          <div className="text-center">
            <Typography variant="h1" gutterBottom>
              2025-26 Income Tax Calculator (A.Y. 2026-27)
            </Typography>
            <p className="text-sm sm:text-base text-blue-700/80 max-w-2xl mx-auto">
              Compare your tax liability under the old and new tax regime
              proposed on 2025 budget.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg shadow-blue-100/50 p-6 sm:p-8 max-w-2xl mx-auto border border-blue-100/50">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Annual Income
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={income}
                    onChange={handleIncomeChange}
                    className="block w-full pl-9 pr-12 py-3 text-base sm:text-lg border-2 border-blue-200 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           placeholder:text-blue-300"
                    placeholder="Enter your annual income"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  House Rent Allowance
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={hra}
                    onChange={handleHraChange}
                    className="block w-full pl-9 pr-12 py-3 text-base sm:text-lg border-2 border-blue-200 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           placeholder:text-blue-300"
                    placeholder="Enter your house rent allowance"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Section 80C (₹) (Max: 1,50,000)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={eightyC}
                    onChange={handleEightyCChange}
                    className="block w-full pl-9 pr-12 py-3 text-base sm:text-lg border-2 border-blue-200 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           placeholder:text-blue-300"
                    placeholder="(Max: 1,50,000)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  National Pension System (₹) (Max: 50,000)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={nps}
                    onChange={handleNpsChange}
                    className="block w-full pl-9 pr-12 py-3 text-base sm:text-lg border-2 border-blue-200 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           placeholder:text-blue-300"
                    placeholder="(Max: 50,000)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Section 80D (Health Insurance Max: 50,000)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={eightyD}
                    onChange={handleEightyDChange}
                    className="block w-full pl-9 pr-12 py-3 text-base sm:text-lg border-2 border-blue-200 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           placeholder:text-blue-300"
                    placeholder="(Max: 50,000)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  Section 24(b) (Home Loan Interest) (Max: 2,00,000)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={lossOnHomeLoan}
                    onChange={handleLossOnHomeLoanChange}
                    className="block w-full pl-9 pr-12 py-3 text-base sm:text-lg border-2 border-blue-200 rounded-lg shadow-sm 
                           focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200
                           placeholder:text-blue-300"
                    placeholder="(Max: 2,00,000)"
                  />
                </div>
              </div>
              <button
                onClick={handleCalculate}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-lg
                       hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 text-base font-medium
                       shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30"
              >
                <Calculator className="w-5 h-5" />
                Calculate Tax
              </button>

              <button
                onClick={() => setShowHelp(!showHelp)}
                className="w-full flex items-center justify-center gap-2 text-blue-700 hover:text-blue-800 
                       py-2 rounded-lg hover:bg-blue-50/50 transition-all duration-200 text-base"
              >
                <HelpCircle className="w-5 h-5" />
                {showHelp ? "Hide Help" : "Show Help"}
              </button>

              {showHelp && (
                <div className="bg-blue-50/50 p-5 rounded-lg text-sm border border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Typography variant="h6" gutterBottom>
                        2025 Old Tax Regime:
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemText
                            primary="Income up to ₹2,50,000"
                            secondary="0%"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="₹2,50,001 to ₹5,00,000"
                            secondary="5%"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="₹5,00,001 to ₹10,00,000"
                            secondary="20%"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Above ₹10,00,001"
                            secondary="30%"
                          />
                        </ListItem>
                      </List>
                    </div>
                    <div>
                      <Typography
                        variant="h6"
                        gutterBottom
                        className="font-semibold text-blue-900 mb-3"
                      >
                        2025 New Tax Regime
                      </Typography>
                      <List
                        sx={{
                          listStyleType: "disc",
                          pl: 5,
                          color: "text.primary",
                        }}
                      >
                        <ListItem sx={{ display: "list-item" }}>
                          <ListItemText
                            primary="Income up to ₹4,00,000"
                            secondary="0%"
                          />
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <ListItemText
                            primary="₹4,00,001 to ₹8,00,000"
                            secondary="5%"
                          />
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <ListItemText
                            primary="₹8,00,001 to ₹12,00,000"
                            secondary="10%"
                          />
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <ListItemText
                            primary="₹12,00,001 to ₹16,00,000"
                            secondary="15%"
                          />
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <ListItemText
                            primary="₹16,00,001 to ₹20,00,000"
                            secondary="20%"
                          />
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <ListItemText
                            primary="₹20,00,001 to ₹24,00,000"
                            secondary="25%"
                          />
                        </ListItem>
                        <ListItem sx={{ display: "list-item" }}>
                          <ListItemText
                            primary="Above ₹24,00,000"
                            secondary="30%"
                          />
                        </ListItem>
                      </List>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 border-t border-blue-100 pt-4 text-blue-700">
                    <p>
                      <strong>2025 Old Tax Regime:</strong> Standard deduction
                      of ₹50,000 and tax rebate under Section 87A up to ₹12,500
                      for income up to ₹5,00,000.
                    </p>
                    <p>
                      <strong>2025 New Tax Regime</strong> Standard deduction of
                      ₹75,000 and tax rebate under Section 87A up to ₹60,000 for
                      income up to ₹12,00,000.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {comparison && <TaxBreakdown comparison={comparison} />}
        </div>

        <footer className="text-center py-6 text-sm text-blue-600 flex flex-col items-center justify-center gap-1.5">
          <div className="flex items-center gap-1.5">
            Made with{" "}
            <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />{" "}
            for Tax payers from Sivaprasath
          </div>
          <a
            href="https://github.com/sivaprasathm93/tax-app"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
          >
            GitHub Repository
          </a>
          <Box
            sx={{
              marginTop: "1rem",
              padding: "1rem",
              border: "2px solid #1976d2",
              borderRadius: "8px",
              backgroundColor: "#e3f2fd",
              textAlign: "center",
              width: "fit-content",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "#1976d2", fontWeight: "bold" }}
            >
              Total Visits: {visitCount}
            </Typography>
          </Box>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
