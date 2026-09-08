import api from "services/http.service";

export type AdminUser = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export async function fetchAdminUsers() {
  const response = await api.get<AdminUser[]>("/admin/users");
  return response.data;
}

export async function setUserIsAdmin(userId: number, isAdmin: boolean) {
  await api.patch(`/admin/users/${userId}`, { isAdmin });
}
