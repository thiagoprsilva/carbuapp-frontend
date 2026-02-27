import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user, oficina, logout } = useAuth();

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      <p>
        Logado como: <b>{user?.nome}</b> ({user?.email}) <br />
        Oficina: <b>{oficina?.nome ?? `ID ${user?.oficinaId}`}</b>
      </p>

      <button onClick={logout} style={{ padding: 10, cursor: "pointer" }}>
        Sair
      </button>
    </div>
  );
}