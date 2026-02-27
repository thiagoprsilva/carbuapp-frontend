import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) return <div style={{ padding: 20 }}>Carregando...</div>;

  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
}