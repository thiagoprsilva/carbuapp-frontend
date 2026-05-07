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

export default function Login() {
  const { login, isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [oficinaId, setOficinaId] = useState<number | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modoSuperAdmin, setModoSuperAdmin] = useState(false);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (user) {
      navigate(isSuperAdmin ? "/superadmin" : "/app", { replace: true });
    }
  }, [user]);

  useEffect(() => {
    if (!modoSuperAdmin) {
      api
        .get<Oficina[]>("/public/oficinas")
        .then((res) => {
          setOficinas(res.data);
          if (res.data.length > 0) setOficinaId(res.data[0].id);
        })
        .catch(() => setError("Não foi possível carregar as oficinas."));
    }
  }, [modoSuperAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, senha, modoSuperAdmin ? undefined : oficinaId);
      // Redirecionamento feito pelo useEffect acima após user atualizar
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as any)?.message ?? "Falha no login."
        );
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
        {/* Logo sempre CarbuApp na tela de login */}
        <img src="/carbuapplogo.png" alt="CarbuApp" className="auth-logo" />
        <h1 className="auth-title">CarbuApp</h1>
        <p className="auth-subtitle">Sistema para Oficinas Automotivas</p>

        {/* Toggle Superadmin */}
        <div style={{ marginBottom: 16, textAlign: "center" }}>
          <button
            type="button"
            className="btn"
            style={{ fontSize: "0.78rem", padding: "4px 12px", minHeight: "auto" }}
            onClick={() => {
              setModoSuperAdmin((v) => !v);
              setError(null);
              setEmail("");
              setSenha("");
            }}
          >
            {modoSuperAdmin ? "← Voltar ao login da oficina" : "Acesso Super Admin"}
          </button>
        </div>

        <p className="sub" style={{ marginTop: 0, marginBottom: 18 }}>
          {modoSuperAdmin
            ? "Login de administrador global"
            : "Escolha a oficina e faça login"}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {!modoSuperAdmin && (
            <label className="form-label">
              Oficina
              <select
                className="select"
                value={oficinaId}
                onChange={(e) => setOficinaId(Number(e.target.value))}
              >
                {oficinas.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome} — {o.responsavel}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="form-label">
            E-mail
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </label>

          <label className="form-label">
            Senha
            <input
              className="input"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
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
