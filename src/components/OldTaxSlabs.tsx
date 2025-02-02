import { Card, CardContent, Typography, Container, Box } from "@mui/material";

const OldTaxRegime = () => {
  const taxSlabs = [
    { primary: "Income up to ₹2,50,000", secondary: "0%" },
    { primary: "₹2,50,001 to ₹5,00,000", secondary: "5%" },
    { primary: "₹5,00,001 to ₹10,00,000", secondary: "20%" },
    { primary: "Above ₹10,00,001", secondary: "30%" },
  ];

  return (
    <Container>
      <Typography variant="h6" gutterBottom>
      2025-26 Old Tax Regime: 
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

export default OldTaxRegime;
