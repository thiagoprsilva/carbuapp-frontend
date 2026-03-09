import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GlobalSearch from "./GlobalSearch";
import { useState } from "react";

export default function Layout() {
  const { user, oficina, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  function handleMobileNavigate() {
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      {/* BOTÃO MOBILE */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
        ☰
      </button>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>

          <img
            src="/carbuapplogo.png"
            alt="Logo do escritório"
            className="sidebar-logo"
          />

          <div className="sidebar-title">CarbuApp</div>
          <div className="sidebar-subtitle">{oficina?.nome ?? "Oficina"}</div>
        </div>

        <nav className="sidebar-nav">
          <Link
            className={`nav-link ${isActive("/") ? "active" : ""}`}
            to="/"
            onClick={handleMobileNavigate}
          >
            Dashboard
          </Link>

          <Link
            className={`nav-link ${isActive("/clientes") ? "active" : ""}`}
            to="/clientes"
            onClick={handleMobileNavigate}
          >
            Clientes
          </Link>

          <Link
            className={`nav-link ${isActive("/veiculos") ? "active" : ""}`}
            to="/veiculos"
            onClick={handleMobileNavigate}
          >
            Veículos
          </Link>

          <Link
            className={`nav-link ${isActive("/registros") ? "active" : ""}`}
            to="/registros"
            onClick={handleMobileNavigate}
          >
            Registros Técnicos
          </Link>

          <Link
            className={`nav-link ${isActive("/orcamentos") ? "active" : ""}`}
            to="/orcamentos"
            onClick={handleMobileNavigate}
          >
            Orçamentos
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="divider" />

          <div className="sidebar-user">
            <div className="sidebar-user-name">{user?.nome ?? "Usuário"}</div>
            <button className="btn btnRed w-full" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="content">
        <div className="container">
          <div className="content-topbar">
            <GlobalSearch />
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
}