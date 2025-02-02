import { Card, CardContent, Typography, Container, Box } from "@mui/material";

const NewTaxSlabs = () => {
  const taxSlabs = [
    { primary: "Income up to ₹4,00,000", secondary: "0%" },
    { primary: "₹4,00,001 to ₹8,00,000", secondary: "5%" },
    { primary: "₹8,00,001 to ₹12,00,000", secondary: "10%" },
    { primary: "₹12,00,001 to ₹16,00,000", secondary: "15%" },
    { primary: "₹16,00,001 to ₹20,00,000", secondary: "20%" },
    { primary: "₹20,00,001 to ₹24,00,000", secondary: "25%" },
    { primary: "Above ₹24,00,000", secondary: "30%" },
  ];

  return (
    <Container>
      <Typography variant="h6" gutterBottom>
        2025-26 New Tax Regime:
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {taxSlabs.map((slab, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Typography variant="body1" color="textPrimary">
                {slab.primary}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {slab.secondary}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default NewTaxSlabs;
