import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

type Oficina = {
  id: number;
  nome: string;
  responsavel: string;
};

type CredencialExemplo = {
  email: string;
  senha: string;
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

  useEffect(() => {
    api
      .get<Oficina[]>("/public/oficinas")
      .then((res) => {
        setOficinas(res.data);
        if (res.data.length > 0) setOficinaId(res.data[0].id);
      })
      .catch(() => setError("Não foi possível carregar as oficinas."));
  }, []);

  const credenciaisPorOficina: Record<number, CredencialExemplo> = {
    1: {
      email: "admin@commenale.local",
      senha: "admin123",
    },
    2: {
      email: "admin@apocalypse.local",
      senha: "admin123",
    },
  };

  const credencialAtual = credenciaisPorOficina[oficinaId] ?? {
    email: "Digite seu e-mail",
    senha: "Digite sua senha",
  };

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
    <div className="auth-shell">
      <div className="auth-card">
        <img src="/carbuapplogo.png" alt="CarbuApp" className="auth-logo" />

        <h1 className="auth-title">CarbuApp</h1>
        <p className="auth-subtitle">Sistema para Oficinas Automotivas</p>
        <p className="sub" style={{ marginTop: 0, marginBottom: 18 }}>
          Escolha a oficina e faça login
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-label">
            Oficina
            <select className="select" value={oficinaId} onChange={(e) => setOficinaId(Number(e.target.value))}>
              {oficinas.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome} - {o.responsavel}
                </option>
              ))}
            </select>
          </label>

          <label className="form-label">
            E-mail
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={credencialAtual.email}
            />
          </label>

          <label className="form-label">
            Senha
            <input
              className="input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={credencialAtual.senha}
            />
          </label>

          {error && <div className="error-text">{error}</div>}

          <button type="submit" disabled={loading} className="btn btnPrimary w-full">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
