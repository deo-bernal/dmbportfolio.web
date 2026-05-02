import { Box, Card, Container, Typography } from "@mui/material";
import LoginJWT from "./LoginJWT";
import { LoginMainContent, LoginTopWrapper, loginPageSx } from "styles/main_style";

export default function Login() {
  return (
    <LoginMainContent>
      <LoginTopWrapper>
        <Container maxWidth="sm">
          <Card elevation={0} sx={loginPageSx.card}>
            <Box>
              <Typography variant="h2" sx={loginPageSx.titleSignIn}>
                Online Profile
              </Typography>
              <Typography variant="h4" sx={loginPageSx.titleSubtitle}>
                Sign in to view your portfolio
              </Typography>
            </Box>
            <LoginJWT />
          </Card>
        </Container>
      </LoginTopWrapper>
    </LoginMainContent>
  );
}
