import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Props = {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "SUPERADMIN";
};

export function PrivateRoute({ children, requiredRole }: Props) {
  const { token, loading, user, isSuperAdmin } = useAuth();

  if (loading) return <div style={{ padding: 20 }}>Carregando...</div>;
  if (!token) return <Navigate to="/login" replace />;

  if (requiredRole === "SUPERADMIN" && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === "ADMIN" && user?.role !== "ADMIN" && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
