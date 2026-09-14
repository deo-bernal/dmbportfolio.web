import api from "services/http.service";

export type AdminUser = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string | null;
  address?: string | null;
  activated: boolean;
  isViewable: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  passwordSet?: boolean;
  PasswordSet?: boolean;
  linkedProviders?: string[];
  LinkedProviders?: string[];
};

export type UpdateAdminUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
  contactNo: string;
  address: string;
  activated: boolean;
  isViewable: boolean;
  isAdmin: boolean;
};

function readJwtUserId(): number | null {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
    const raw =
      payload.nameid ??
      payload.sub ??
      payload.userId ??
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    const userId = Number(raw);
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

export function getCurrentAdminUserId() {
  return readJwtUserId();
}

function readProviders(raw: Record<string, unknown>): string[] {
  const value = raw.linkedProviders ?? raw.LinkedProviders;
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean);
}

function normalizeAdminUser(raw: AdminUser & Record<string, unknown>): AdminUser {
  const passwordSet = raw.passwordSet ?? raw.PasswordSet;
  return {
    ...raw,
    passwordSet: typeof passwordSet === "boolean" ? passwordSet : true,
    linkedProviders: readProviders(raw),
  };
}

export async function fetchAdminUsers() {
  const response = await api.get<Array<AdminUser & Record<string, unknown>>>("/admin/users");
  return (response.data ?? []).map(normalizeAdminUser);
}

export async function setUserIsAdmin(userId: number, isAdmin: boolean) {
  await api.patch(`/admin/users/${userId}`, { isAdmin });
}

export async function updateAdminUser(userId: number, payload: UpdateAdminUserRequest) {
  await api.put(`/admin/users/${userId}`, payload);
}

export async function deleteAdminUser(userId: number) {
  await api.delete(`/admin/users/${userId}`);
}
