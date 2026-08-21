import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    // Mostrar un indicador de carga mientras se verifica la autenticación
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirigir al dashboard correspondiente según el rol
    const dashboardPath = `/${user.role}`;
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
}