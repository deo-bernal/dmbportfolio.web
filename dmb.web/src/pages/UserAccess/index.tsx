import { Box, Container, Typography } from "@mui/material";
import AdminUsersPanel from "components/admin/AdminUsersPanel";
import { showcaseSx } from "styles/main_style";

export default function UserAccessPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={showcaseSx.kicker}>Super admin</Typography>
        <Typography component="h1" sx={showcaseSx.sectionTitle}>
          Who can open Leads
        </Typography>
        <Typography sx={showcaseSx.cardBody}>
          Grant Admin to people who should work the pipeline. Super admin cannot be given or
          removed from this list.
        </Typography>
      </Box>
      <AdminUsersPanel />
    </Container>
  );
}
