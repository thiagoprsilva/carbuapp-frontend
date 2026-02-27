import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
  const { user, oficina, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* SIDEBAR */}
      <aside
        style={{
          width: 240,
          background: "#111827",
          color: "#fff",
          padding: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ marginBottom: 6 }}>CarbuApp</h2>
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 20 }}>
          {oficina?.nome}
        </p>

        <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link to="/">Dashboard</Link>
          <Link to="/clientes">Clientes</Link>
          <Link to="/veiculos">Veículos</Link>
          <Link to="/registros">Registros Técnicos</Link>
          <Link to="/orcamentos">Orçamentos</Link>
        </nav>

        <div style={{ marginTop: "auto" }}>
          <hr style={{ margin: "20px 0", opacity: 0.2 }} />
          <p style={{ fontSize: 12 }}>{user?.nome}</p>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 10,
              padding: 8,
              width: "100%",
              background: "#1f2937",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              borderRadius: 4,
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main
        style={{
          flex: 1,
          padding: 40,
          background: "#ffffff",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}