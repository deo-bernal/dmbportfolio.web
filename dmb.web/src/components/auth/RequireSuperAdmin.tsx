import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import useAccountRoles from "hooks/useAccountRoles";

export default function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { isSuperAdmin, canAccessLeads, isLoading, accountResolved } = useAccountRoles();

  if (isLoading || !accountResolved) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Navigate
        to={canAccessLeads ? "/accent-sidebar/leads" : "/accent-sidebar/portfolio"}
        replace
      />
    );
  }

  return <>{children}</>;
}
