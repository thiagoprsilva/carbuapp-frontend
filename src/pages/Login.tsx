import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (user) {
      navigate(isSuperAdmin ? "/superadmin" : "/app", { replace: true });
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, senha);
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
        <img src="/carbuapplogo.png" alt="CarbuApp" className="auth-logo" />
        <h1 className="auth-title">CarbuApp</h1>
        <p className="auth-subtitle">Sistema para Oficinas Automotivas</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-label">
            E-mail
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              autoFocus
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
