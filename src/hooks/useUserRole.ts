import { useAuth } from "../context/AuthContext";

export function useUserRole() {
  const { isAdmin, isRoleLoading } = useAuth();

  return {
    isAdmin,
    isRoleLoading,
  };
}
