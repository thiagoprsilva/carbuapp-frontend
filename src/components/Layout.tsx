import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GlobalSearch from "./GlobalSearch";
import BottomNav from "./BottomNav";
import FAB from "./FAB";
import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function Layout() {
  const { user, oficina, selectedOficina, isSuperAdmin, isAdmin, oficinaAtiva, logout, exitOficina } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  function handleMobileNavigate() {
    setSidebarOpen(false);
  }

  // URL da logo: prioriza a oficina ativa (selecionada pelo superadmin ou própria)
  const logoUrl = oficinaAtiva?.logoUrl
    ? `${API_URL}/uploads/${oficinaAtiva.logoUrl}`
    : null;

  // Superadmin sem oficina selecionada → layout de gerenciamento global
  const modoGlobal = isSuperAdmin && !selectedOficina;

  return (
    <div className="app-shell">
      {/* BOTÃO MOBILE */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            ✕
          </button>

          {/* Logo da oficina ou logo padrão CarbuApp */}
          {logoUrl ? (
            <img src={logoUrl} alt="Logo da oficina" className="sidebar-logo" />
          ) : (
            <img src="/carbuapplogo.png" alt="CarbuApp" className="sidebar-logo" />
          )}

          <div className="sidebar-title">
            {modoGlobal ? "Super Admin" : (oficinaAtiva?.nome ?? "CarbuApp")}
          </div>
          {!modoGlobal && (
            <div className="sidebar-subtitle">{oficina?.nome ?? selectedOficina?.nome ?? ""}</div>
          )}
        </div>

        <nav className="sidebar-nav">
          {/* Superadmin sem oficina selecionada → menu global */}
          {modoGlobal ? (
            <>
              <Link
                className={`nav-link ${isActive("/superadmin") ? "active" : ""}`}
                to="/superadmin"
                onClick={handleMobileNavigate}
              >
                🏢 Oficinas
              </Link>
              <Link
                className={`nav-link ${isActive("/usuarios") ? "active" : ""}`}
                to="/usuarios"
                onClick={handleMobileNavigate}
              >
                👥 Usuários
              </Link>
            </>
          ) : (
            /* Menu normal (admin / mecânico / superadmin dentro de uma oficina) */
            <>
              <Link className={`nav-link ${isActive("/app") ? "active" : ""}`} to="/app" onClick={handleMobileNavigate}>
                Dashboard
              </Link>
              <Link className={`nav-link ${isActive("/clientes") ? "active" : ""}`} to="/clientes" onClick={handleMobileNavigate}>
                Clientes
              </Link>
              <Link className={`nav-link ${isActive("/veiculos") ? "active" : ""}`} to="/veiculos" onClick={handleMobileNavigate}>
                Veículos
              </Link>
              <Link className={`nav-link ${isActive("/registros") ? "active" : ""}`} to="/registros" onClick={handleMobileNavigate}>
                Ordens de Serviço
              </Link>
              <Link className={`nav-link ${isActive("/orcamentos") ? "active" : ""}`} to="/orcamentos" onClick={handleMobileNavigate}>
                Orçamentos
              </Link>
              <Link className={`nav-link ${isActive("/kanban") ? "active" : ""}`} to="/kanban" onClick={handleMobileNavigate}>
                📋 Kanban
              </Link>

              {/* Link Administração: visível para admin e superadmin dentro de uma oficina */}
              {isAdmin && (
                <Link
                  className={`nav-link ${isActive("/admin") ? "active" : ""}`}
                  to="/admin"
                  onClick={handleMobileNavigate}
                >
                  ⚙️ Administração
                </Link>
              )}

              {/* Superadmin dentro de uma oficina pode voltar ao painel global */}
              {isSuperAdmin && selectedOficina && (
                <Link
                  className={`nav-link ${isActive("/superadmin") ? "active" : ""}`}
                  to="/superadmin"
                  onClick={() => { exitOficina(); handleMobileNavigate(); }}
                >
                  🏢 Painel Global
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="divider" />
          <div className="sidebar-user">
            <div className="sidebar-user-label">Logado como</div>
            <div className="sidebar-user-name">{user?.nome ?? "Usuário"}</div>
            <button className="btn btnRed w-full" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="content">
        <div className="container">
          {/* Banner: superadmin operando dentro de uma oficina */}
          {isSuperAdmin && selectedOficina && (
            <div className="superadmin-banner">
              <span>🔑 Acessando como admin: <strong>{selectedOficina.nome}</strong></span>
              <button
                className="btn"
                style={{ padding: "4px 12px", minHeight: "auto", fontSize: "0.82rem" }}
                onClick={() => { exitOficina(); navigate("/superadmin"); }}
              >
                Sair da oficina
              </button>
            </div>
          )}

          <div className="content-topbar">
            <GlobalSearch />
          </div>

          <Outlet />
        </div>
      </main>

      {/* BOTTOM NAV + FAB (mobile, apenas modo normal) */}
      {!modoGlobal && (
        <>
          <BottomNav />
          <FAB />
        </>
      )}
    </div>
  );
}
