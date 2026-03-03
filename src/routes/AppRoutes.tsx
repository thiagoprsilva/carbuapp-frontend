import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import { PrivateRoute } from "./PrivateRoute";
import Layout from "../components/Layout";

import Clientes from "../pages/Clientes";
import Veiculos from "../pages/Veiculos";
import Registros from "../pages/Registros";
import Orcamentos from "../pages/Orcamentos";

import ClienteDetalhe from "../pages/ClienteDetalhe";
import VeiculoDetalhe from "../pages/VeiculoDetalhe";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />

          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhe />} />

          <Route path="/veiculos" element={<Veiculos />} />
          <Route path="/veiculos/:id" element={<VeiculoDetalhe />} />

          <Route path="/registros" element={<Registros />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}