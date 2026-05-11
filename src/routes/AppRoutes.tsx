import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Layout from "../components/Layout";
import { PrivateRoute } from "./PrivateRoute";

import Clientes from "../pages/Clientes";
import ClienteDetalhe from "../pages/ClienteDetalhe";
import Veiculos from "../pages/Veiculos";
import VeiculoDetalhe from "../pages/VeiculoDetalhe";
import Registros from "../pages/Registros";
import Orcamentos from "../pages/Orcamentos";
import KanbanOS from "../pages/KanbanOS";
import Admin from "../pages/Admin";
import Superadmin from "../pages/Superadmin";
import SuperadminOficina from "../pages/SuperadminOficina";
import SuperadminUsuarios from "../pages/SuperadminUsuarios";

// Redireciona superadmin para /superadmin e demais para /app
function HomeRedirect() {
  const { isSuperAdmin, selectedOficina } = useAuth();
  if (isSuperAdmin && !selectedOficina) return <Navigate to="/superadmin" replace />;
  return <Dashboard />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — sempre pública */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* /app é o home após login */}
          <Route path="/app" element={<HomeRedirect />} />

          {/* Rotas normais de operação (mecânico / admin / superadmin dentro de oficina) */}
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhe />} />
          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/veiculos/:id" element={<VeiculoDetalhe />} />
          <Route path="/registros" element={<Registros />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/kanban" element={<KanbanOS />} />

          {/* Administração da oficina (admin + superadmin) */}
          <Route
            path="/admin"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <Admin />
              </PrivateRoute>
            }
          />

          {/* Painel global superadmin */}
          <Route
            path="/superadmin"
            element={
              <PrivateRoute requiredRole="SUPERADMIN">
                <Superadmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/superadmin/oficinas/:id"
            element={
              <PrivateRoute requiredRole="SUPERADMIN">
                <SuperadminOficina />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <PrivateRoute requiredRole="SUPERADMIN">
                <SuperadminUsuarios />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
