import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, isLoading, isRoleLoading } = useAuth();
  const location = useLocation();

  if (isLoading || isRoleLoading) {
    return <p className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Проверяваме администраторски достъп...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
