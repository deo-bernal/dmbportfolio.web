import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  deleteAdminUser,
  fetchAdminUsers,
  getCurrentAdminUserId,
  updateAdminUser,
  type AdminUser,
  type UpdateAdminUserRequest,
} from "services/adminUsers.service";
import { accentRedContainedButtonSx, showcaseSx } from "styles/main_style";

function displayName(user: AdminUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
}

function providerLabel(provider: string) {
  const value = provider.trim().toLowerCase();
  if (value === "google") return "Google";
  if (value === "linkedin") return "LinkedIn";
  if (value === "facebook") return "Facebook";
  return provider;
}

function linkedApps(user: AdminUser) {
  return (user.linkedProviders ?? []).map(providerLabel).filter(Boolean);
}

function signInSummary(user: AdminUser) {
  const apps = linkedApps(user);
  const methods = user.passwordSet === false ? [...apps] : ["Email and password", ...apps];
  return methods.length > 0 ? methods.join(" · ") : "Email and password";
}

function toDraft(user: AdminUser): UpdateAdminUserRequest {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
    contactNo: user.contactNo ?? "",
    address: user.address ?? "",
    activated: Boolean(user.activated),
    isViewable: Boolean(user.isViewable),
    isAdmin: Boolean(user.isAdmin || user.isSuperAdmin),
  };
}

export default function AdminUsersPanel() {
  const currentUserId = useMemo(() => getCurrentAdminUserId(), []);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<UpdateAdminUserRequest | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

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

  const visibleUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => {
      const haystack = [
        user.firstName,
        user.lastName,
        user.email,
        user.username,
        user.contactNo,
        signInSummary(user),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, users]);

  const openEdit = (user: AdminUser) => {
    setError(null);
    setEditingUser(user);
    setDraft(toDraft(user));
  };

  const handleSave = async () => {
    if (!editingUser || !draft) return;
    const firstName = draft.firstName.trim();
    const lastName = draft.lastName.trim();
    const email = draft.email.trim();
    if (!firstName || !lastName || !email) {
      setError("First name, last name, and email are required.");
      return;
    }

    setBusyUserId(editingUser.userId);
    setError(null);
    try {
      const payload = { ...draft, firstName, lastName, email };
      await updateAdminUser(editingUser.userId, payload);
      setUsers((current) =>
        current.map((item) =>
          item.userId === editingUser.userId
            ? {
                ...item,
                ...payload,
                username: email,
                isAdmin: item.isSuperAdmin ? item.isAdmin : payload.isAdmin,
              }
            : item
        )
      );
      setEditingUser(null);
      setDraft(null);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data.message
          : "Could not update that user.";
      setError(message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setBusyUserId(deletingUser.userId);
    setError(null);
    try {
      await deleteAdminUser(deletingUser.userId);
      setUsers((current) => current.filter((item) => item.userId !== deletingUser.userId));
      setDeletingUser(null);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data.message
          : "Could not delete that user.";
      setError(message);
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

      <TextField
        label="Search users"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      />

      {isLoading ? (
        <Stack sx={{ alignItems: "center", py: 2 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : visibleUsers.length === 0 ? (
        <Typography sx={showcaseSx.cardBody}>No users match that search.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {visibleUsers.map((user) => {
            const isSelf = currentUserId === user.userId;
            const canDelete = !user.isSuperAdmin && !isSelf;
            return (
              <Stack
                key={user.userId}
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{displayName(user)}</Typography>
                  <Typography sx={showcaseSx.codeCaption}>
                    {user.email}
                    {user.contactNo ? ` · ${user.contactNo}` : ""}
                    {user.isSuperAdmin ? " · super admin" : user.isAdmin ? " · admin" : ""}
                    {user.activated ? "" : " · not activated"}
                    {` · ${signInSummary(user)}`}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={busyUserId === user.userId}
                    onClick={() => openEdit(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    disabled={!canDelete || busyUserId === user.userId}
                    onClick={() => {
                      setError(null);
                      setDeletingUser(user);
                    }}
                  >
                    Delete
                  </Button>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={Boolean(editingUser && draft)}
        onClose={busyUserId ? undefined : () => setEditingUser(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update user</DialogTitle>
        {draft ? (
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="First name"
                  value={draft.firstName}
                  onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
                  fullWidth
                />
                <TextField
                  label="Last name"
                  value={draft.lastName}
                  onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                fullWidth
              />
              <TextField
                label="Phone"
                value={draft.contactNo}
                onChange={(event) => setDraft({ ...draft, contactNo: event.target.value })}
                fullWidth
              />
              <TextField
                label="Address"
                value={draft.address}
                onChange={(event) => setDraft({ ...draft, address: event.target.value })}
                fullWidth
              />
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}>
                  Sign-in methods
                </Typography>
                <Typography sx={{ mt: 0.75 }}>
                  {editingUser ? signInSummary(editingUser) : "Email and password"}
                </Typography>
                  {(() => {
                    const apps = editingUser ? linkedApps(editingUser) : [];
                    return apps.length > 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Linked apps: {apps.join(", ")}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        No Google, LinkedIn, or Facebook login is linked yet.
                      </Typography>
                    );
                  })()}
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.activated}
                    onChange={(event) => setDraft({ ...draft, activated: event.target.checked })}
                  />
                }
                label="Activated"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.isViewable}
                    onChange={(event) => setDraft({ ...draft, isViewable: event.target.checked })}
                  />
                }
                label="Public portfolio viewable"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.isAdmin}
                    disabled={Boolean(editingUser?.isSuperAdmin)}
                    onChange={(event) => setDraft({ ...draft, isAdmin: event.target.checked })}
                  />
                }
                label={editingUser?.isSuperAdmin ? "Admin (super admin)" : "Admin"}
              />
            </Stack>
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button onClick={() => setEditingUser(null)} disabled={busyUserId !== null}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={busyUserId !== null}
            sx={accentRedContainedButtonSx}
          >
            {busyUserId ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deletingUser)}
        onClose={busyUserId ? undefined : () => setDeletingUser(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          <Typography>
            Permanently delete {deletingUser ? displayName(deletingUser) : "this user"}
            {deletingUser ? ` (${deletingUser.email})` : ""}? This removes their account, portfolio,
            resume, projects, work history, education, affiliations, and login tokens. This cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingUser(null)} disabled={busyUserId !== null}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={busyUserId !== null}
          >
            {busyUserId ? "Deleting..." : "Delete user"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
