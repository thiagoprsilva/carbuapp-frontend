import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

type Summary = {
  totais: {
    clientes: number;
    veiculos: number;
    registros: number;
    orcamentos: number;
  };
  recentes: {
    registros: Array<{
      id: number;
      categoria: string;
      descricao: string;
      dataServico: string;
      createdAt: string;
      veiculo: {
        id: number;
        placa: string;
        modelo: string;
        cliente: { id: number; nome: string } | null;
      };
      orcamento: { id: number; numero: number } | null;
    }>;
    orcamentos: Array<{
      id: number;
      numero: number;
      total: number;
      createdAt: string;
      veiculo: {
        id: number;
        placa: string;
        modelo: string;
        cliente: { id: number; nome: string } | null;
      };
    }>;
  };
};

export default function Dashboard() {
  const { user, oficina, logout } = useAuth();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  function formatPtBr(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await api.get<Summary>("/dashboard/summary");
      setSummary(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 6 }}>Dashboard</h2>
          <div style={{ opacity: 0.85 }}>
            Logado como: <b>{user?.nome}</b> ({user?.email}) <br />
            Oficina: <b>{oficina?.nome ?? `ID ${user?.oficinaId}`}</b>
          </div>
        </div>

        <button
          onClick={logout}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>

      {loading ? (
        <div style={{ marginTop: 16 }}>Carregando...</div>
      ) : !summary ? (
        <div style={{ marginTop: 16 }}>Sem dados.</div>
      ) : (
        <>
          {/* Cards */}
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            {[
              { label: "Clientes", value: summary.totais.clientes, to: "/clientes" },
              { label: "Veículos", value: summary.totais.veiculos, to: "/veiculos" },
              { label: "Registros Técnicos", value: summary.totais.registros, to: "/registros" },
              { label: "Orçamentos", value: summary.totais.orcamentos, to: "/orcamentos" },
            ].map((c) => (
              <Link
                key={c.label}
                to={c.to}
                style={{
                  textDecoration: "none",
                  color: "#111827",
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 13, opacity: 0.75 }}>{c.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{c.value}</div>
              </Link>
            ))}
          </div>

          {/* Recentes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            {/* Últimos Registros */}
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Últimos Registros</h3>
                <Link to="/registros" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 800 }}>
                  Ver todos
                </Link>
              </div>

              {summary.recentes.registros.length === 0 ? (
                <div style={{ marginTop: 10, opacity: 0.7 }}>Nenhum registro.</div>
              ) : (
                <table style={{ width: "100%", border: "1px solid #eee", marginTop: 10 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Data</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Veículo</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentes.registros.map((r) => (
                      <tr key={r.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                          {formatPtBr(r.dataServico)}
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                          <Link
                            to={`/veiculos/${r.veiculo.id}`}
                            style={{ color: "#2563eb", textDecoration: "none", fontWeight: 800 }}
                          >
                            {r.veiculo.modelo} ({r.veiculo.placa})
                          </Link>
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{r.categoria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Últimos Orçamentos */}
            <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>Últimos Orçamentos</h3>
                <Link to="/orcamentos" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 800 }}>
                  Ver todos
                </Link>
              </div>

              {summary.recentes.orcamentos.length === 0 ? (
                <div style={{ marginTop: 10, opacity: 0.7 }}>Nenhum orçamento.</div>
              ) : (
                <table style={{ width: "100%", border: "1px solid #eee", marginTop: 10 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Número</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Veículo</th>
                      <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentes.orcamentos.map((o) => (
                      <tr key={o.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>#{o.numero}</td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                          <Link
                            to={`/veiculos/${o.veiculo.id}`}
                            style={{ color: "#2563eb", textDecoration: "none", fontWeight: 800 }}
                          >
                            {o.veiculo.modelo} ({o.veiculo.placa})
                          </Link>
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                          R$ {Number(o.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <button
            onClick={loadSummary}
            style={{
              marginTop: 14,
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Atualizar
          </button>
        </>
      )}
    </div>
  );
}