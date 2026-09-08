import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import useAccountRoles from "hooks/useAccountRoles";

export default function RequireLeadAccess({ children }: { children: ReactNode }) {
  const { canAccessLeads, isLoading, accountResolved } = useAccountRoles();

  if (isLoading || !accountResolved) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!canAccessLeads) {
    return <Navigate to="/accent-sidebar/portfolio" replace />;
  }

  return <>{children}</>;
}
