import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { SkeletonCard } from "../components/Skeleton";

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
      numero: number;
      status: string;
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

const STATUS_OS_COR: Record<string, string> = {
  "Aberta":            "#f59e0b",
  "Em andamento":      "#60a5fa",
  "Aguardando peças":  "#a78bfa",
  "Concluída":         "#4ade80",
  "Cancelada":         "#f87171",
};

export default function Dashboard() {
  const { user, oficina, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: summary, isLoading: loading } = useQuery<Summary>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      try {
        const res = await api.get<Summary>("/dashboard/summary");
        return res.data;
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Erro ao carregar dashboard.");
        throw err;
      }
    },
  });

  function formatPtBr(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  function loadSummary() {
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h2">Dashboard</h2>
          <div className="sub">
            Logado como: <b>{user?.nome}</b> ({user?.email}) <br />
            Oficina: <b>{oficina?.nome ?? `ID ${user?.oficinaId}`}</b>
          </div>
        </div>

        <div className="page-header-actions">
          <button className="btn btnGray" onClick={loadSummary} type="button" disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>

          <button className="btn btnRed" onClick={logout} type="button">
            Sair
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ marginTop: 14 }}>
          <SkeletonCard lines={6} />
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
          {/* CTA principal: Entrada de Veículo */}
          <div
            className="card"
            style={{
              marginTop: 14,
              background: "linear-gradient(135deg, var(--primary) 0%, #d97706 100%)",
              borderColor: "var(--primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
            onClick={() => navigate("/entrada")}
          >
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#000" }}>+ Entrada de Veículo</div>
              <div style={{ fontSize: 13, color: "#000", opacity: 0.75, marginTop: 2 }}>
                Iniciar nova OS — laudo, vistoria e orçamento
              </div>
            </div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>

          <div className="grid4" style={{ marginTop: 14 }}>
            <Link className="card card-stat" to="/clientes" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
              <div className="sub">Clientes</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{summary.totais.clientes}</div>
              {summary.totais.clientes === 0
                ? <div className="stat-cta">Cadastrar primeiro →</div>
                : <div className="stat-link">Ver todos →</div>
              }
            </Link>

            <Link className="card card-stat" to="/veiculos" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
              <div className="sub">Veículos</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{summary.totais.veiculos}</div>
              {summary.totais.veiculos === 0
                ? <div className="stat-cta">Cadastrar primeiro →</div>
                : <div className="stat-link">Ver todos →</div>
              }
            </Link>

            <Link className="card card-stat" to="/registros" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
              <div className="sub">Ordens de Serviço</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{summary.totais.registros}</div>
              {summary.totais.registros === 0
                ? <div className="stat-cta">Criar primeiro →</div>
                : <div className="stat-link">Ver todos →</div>
              }
            </Link>

            <Link className="card card-stat" to="/orcamentos" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
              <div className="sub">Orçamentos</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>{summary.totais.orcamentos}</div>
              {summary.totais.orcamentos === 0
                ? <div className="stat-cta">Criar primeiro →</div>
                : <div className="stat-link">Ver todos →</div>
              }
            </Link>
          </div>

          <div className="grid2" style={{ marginTop: 14 }}>
            <div className="card">
              <div className="page-header" style={{ marginBottom: 10 }}>
                <h3 style={{ margin: 0 }}>Últimas OS</h3>
                <Link to="/registros" className="btn">
                  Ver todas
                </Link>
              </div>

              {summary.recentes.registros.length === 0 ? (
                <div className="sub" style={{ marginTop: 10 }}>
                  Nenhuma OS.
                </div>
              ) : (
                <div className="table-scroll" style={{ marginTop: 10 }}>
                  <table className="table table-min-md table-cards">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Veículo</th>
                        <th>Status</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentes.registros.map((r) => {
                        const cor = STATUS_OS_COR[r.status] ?? "#8b8d9e";
                        return (
                          <tr key={r.id}>
                            <td data-label="#" style={{ fontWeight: 900 }}>
                              <Link to={`/registros/${r.id}`} style={{ textDecoration: "none" }}>
                                OS-{r.numero}
                              </Link>
                            </td>
                            <td data-label="Veículo">
                              <Link to={`/veiculos/${r.veiculo.id}`} style={{ fontWeight: 900, textDecoration: "none" }}>
                                {r.veiculo.modelo} ({r.veiculo.placa})
                              </Link>
                            </td>
                            <td data-label="Status">
                              <span className="badge" style={{ color: cor, borderColor: cor, background: `${cor}18` }}>
                                {r.status}
                              </span>
                            </td>
                            <td data-label="Data">{formatPtBr(r.dataServico)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="page-header" style={{ marginBottom: 10 }}>
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
                <div className="table-scroll" style={{ marginTop: 10 }}>
                  <table className="table table-min-md table-cards">
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
                          <td data-label="#" style={{ fontWeight: 900 }}>#{o.numero}</td>
                          <td data-label="Data">{formatPtBr(o.createdAt)}</td>
                          <td data-label="Veículo">
                            <Link to={`/veiculos/${o.veiculo.id}`} style={{ fontWeight: 900, textDecoration: "none" }}>
                              {o.veiculo.modelo} ({o.veiculo.placa})
                            </Link>
                          </td>
                          <td data-label="Total">R$ {Number(o.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
