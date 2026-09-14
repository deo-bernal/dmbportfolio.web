import { Box, Card, Container, Typography } from "@mui/material";
import MarketingLayout from "components/layout/MarketingLayout";
import LoginJWT from "./LoginJWT";
import { loginPageSx, onboardingPageSx } from "styles/main_style";

export default function Login() {
  return (
    <MarketingLayout mainSx={onboardingPageSx.container}>
      <Container maxWidth="sm">
        <Card elevation={0} sx={loginPageSx.card}>
          <Box>
            <Typography variant="h2" sx={loginPageSx.titleSignIn}>
              DMB Web Solutions
            </Typography>
            <Typography variant="h4" sx={loginPageSx.titleSubtitle}>
              Sign in to your workspace
            </Typography>
          </Box>
          <LoginJWT />
        </Card>
      </Container>
    </MarketingLayout>
  );
}
