import { useSelector } from "store";

export default function useAccountRoles() {
  const { isAdmin, isSuperAdmin, isLoading, accountResolved } = useSelector((state) => ({
    isAdmin: state.user.accountRoles.isAdmin,
    isSuperAdmin: state.user.accountRoles.isSuperAdmin,
    isLoading: state.user.isLoading,
    accountResolved: state.user.accountResolved,
  }));

  return {
    isAdmin,
    isSuperAdmin,
    canAccessLeads: isAdmin || isSuperAdmin,
    canAccessUserAccess: isSuperAdmin,
    isLoading,
    accountResolved,
  };
}
