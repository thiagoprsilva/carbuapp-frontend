import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type Oficina = {
  id: number;
  nome: string;
  responsavel: string;
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [oficinaId, setOficinaId] = useState<number>(1);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Busca oficinas públicas para montar dropdown
  useEffect(() => {
    api.get<Oficina[]>("/public/oficinas")
      .then((res) => {
        setOficinas(res.data);
        if (res.data.length > 0) setOficinaId(res.data[0].id);
      })
      .catch(() => setError("Não foi possível carregar as oficinas."));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, senha, oficinaId);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Falha no login.";
        setError(message);
      } else if (err instanceof Error) {
        setError(err.message || "Falha no login.");
      } else {
        setError("Falha no login.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h1 style={{ marginBottom: 6 }}>CarbuApp</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>Escolha a oficina e faça login</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Oficina
          <select
            value={oficinaId}
            onChange={(e) => setOficinaId(Number(e.target.value))}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            {oficinas.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome} — {o.responsavel}
              </option>
            ))}
          </select>
        </label>

        <label>
          E-mail
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@commenale.local"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="admin123"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: 12, cursor: "pointer" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}