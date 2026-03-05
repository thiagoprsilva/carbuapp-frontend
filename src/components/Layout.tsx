import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import GlobalSearch from "./GlobalSearch";

export default function Layout() {
  const { user, oficina, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">CarbuApp</div>
          <div className="sidebar-subtitle">{oficina?.nome ?? "Oficina"}</div>
        </div>

        <nav className="sidebar-nav">
          <Link className={`nav-link ${isActive("/") ? "active" : ""}`} to="/">
            Dashboard
          </Link>

          <Link className={`nav-link ${isActive("/clientes") ? "active" : ""}`} to="/clientes">
            Clientes
          </Link>

          <Link className={`nav-link ${isActive("/veiculos") ? "active" : ""}`} to="/veiculos">
            Veículos
          </Link>

          <Link className={`nav-link ${isActive("/registros") ? "active" : ""}`} to="/registros">
            Registros Técnicos
          </Link>

          <Link className={`nav-link ${isActive("/orcamentos") ? "active" : ""}`} to="/orcamentos">
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
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <GlobalSearch />
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
