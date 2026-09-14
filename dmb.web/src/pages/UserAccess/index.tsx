import { Box, Container, Typography } from "@mui/material";
import AdminUsersPanel from "components/admin/AdminUsersPanel";
import { showcaseSx } from "styles/main_style";

export default function UserAccessPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={showcaseSx.kicker}>Super admin</Typography>
        <Typography component="h1" sx={showcaseSx.sectionTitle}>
          Manage users
        </Typography>
        <Typography sx={showcaseSx.cardBody}>
          Update account details or delete a user and every related record. Super admin cannot be
          deleted, and you cannot delete your own account from here.
        </Typography>
      </Box>
      <AdminUsersPanel />
    </Container>
  );
}
