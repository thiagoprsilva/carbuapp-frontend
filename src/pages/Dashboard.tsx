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
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="row">
        <div>
          <h2 className="h2">Dashboard</h2>
          <div className="sub">
            Logado como: <b>{user?.nome}</b> ({user?.email}) <br />
            Oficina: <b>{oficina?.nome ?? `ID ${user?.oficinaId}`}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btnGray" onClick={loadSummary} type="button" disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>

          <button className="btn btnRed" onClick={logout} type="button">
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="card" style={{ marginTop: 14 }}>
          Carregando...
        </div>
      ) : !summary ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="sub">Sem dados.</div>
          <div style={{ marginTop: 10 }}>
            <button className="btn btnPrimary" onClick={loadSummary} type="button">
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="grid4" style={{ marginTop: 14 }}>
            <Link className="card" to="/clientes" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="sub">Clientes</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{summary.totais.clientes}</div>
            </Link>

            <Link className="card" to="/veiculos" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="sub">Veículos</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{summary.totais.veiculos}</div>
            </Link>

            <Link className="card" to="/registros" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="sub">Registros Técnicos</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{summary.totais.registros}</div>
            </Link>

            <Link className="card" to="/orcamentos" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="sub">Orçamentos</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{summary.totais.orcamentos}</div>
            </Link>
          </div>

          {/* Recentes */}
          <div className="grid2" style={{ marginTop: 14 }}>
            {/* Últimos Registros */}
            <div className="card">
              <div className="row">
                <h3 style={{ margin: 0 }}>Últimos Registros</h3>
                <Link to="/registros" className="btn">
                  Ver todos
                </Link>
              </div>

              {summary.recentes.registros.length === 0 ? (
                <div className="sub" style={{ marginTop: 10 }}>
                  Nenhum registro.
                </div>
              ) : (
                <table className="table" style={{ marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Veículo</th>
                      <th>Categoria</th>
                      <th>Orçamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentes.registros.map((r) => (
                      <tr key={r.id}>
                        <td>{formatPtBr(r.dataServico)}</td>
                        <td>
                          <Link
                            to={`/veiculos/${r.veiculo.id}`}
                            style={{ fontWeight: 900, textDecoration: "none" }}
                          >
                            {r.veiculo.modelo} ({r.veiculo.placa})
                          </Link>
                        </td>
                        <td>
                          <span className="badge">{r.categoria}</span>
                        </td>
                        <td>{r.orcamento ? `#${r.orcamento.numero}` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Últimos Orçamentos */}
            <div className="card">
              <div className="row">
                <h3 style={{ margin: 0 }}>Últimos Orçamentos</h3>
                <Link to="/orcamentos" className="btn">
                  Ver todos
                </Link>
              </div>

              {summary.recentes.orcamentos.length === 0 ? (
                <div className="sub" style={{ marginTop: 10 }}>
                  Nenhum orçamento.
                </div>
              ) : (
                <table className="table" style={{ marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Data</th>
                      <th>Veículo</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentes.orcamentos.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 900 }}>#{o.numero}</td>
                        <td>{formatPtBr(o.createdAt)}</td>
                        <td>
                          <Link
                            to={`/veiculos/${o.veiculo.id}`}
                            style={{ fontWeight: 900, textDecoration: "none" }}
                          >
                            {o.veiculo.modelo} ({o.veiculo.placa})
                          </Link>
                        </td>
                        <td>R$ {Number(o.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}