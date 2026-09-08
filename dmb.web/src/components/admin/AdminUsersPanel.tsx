import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { fetchAdminUsers, setUserIsAdmin, type AdminUser } from "services/adminUsers.service";
import { showcaseSx } from "styles/main_style";

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await fetchAdminUsers());
    } catch {
      setError("Could not load users. Super admin access is required.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggle = async (user: AdminUser, isAdmin: boolean) => {
    setBusyUserId(user.userId);
    setError(null);
    setUsers((current) =>
      current.map((item) => (item.userId === user.userId ? { ...item, isAdmin } : item))
    );

    try {
      await setUserIsAdmin(user.userId, isAdmin);
    } catch {
      setUsers((current) =>
        current.map((item) =>
          item.userId === user.userId ? { ...item, isAdmin: user.isAdmin } : item
        )
      );
      setError("Could not update admin access for that user.");
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <Box sx={showcaseSx.card}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack sx={{ alignItems: "center", py: 2 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {users.map((user) => (
            <Stack
              key={user.userId}
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}
                </Typography>
                <Typography sx={showcaseSx.codeCaption}>
                  {user.email}
                  {user.isSuperAdmin ? " · super admin" : ""}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={user.isAdmin || user.isSuperAdmin}
                    disabled={user.isSuperAdmin || busyUserId === user.userId}
                    onChange={(event) => void handleToggle(user, event.target.checked)}
                    inputProps={{
                      "aria-label": `Admin access for ${user.email}`,
                    }}
                  />
                }
                label="Admin"
              />
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
