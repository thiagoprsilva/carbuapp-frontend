import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { SkeletonCard } from "../components/Skeleton";

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
};

type Veiculo = {
  id: number;
  placa: string;
  modelo: string;
  ano?: string | null;
  motor?: string | null;
  alimentacao?: string | null;
  clienteId: number;
  cliente?: Cliente;
};

type RegistroTecnico = {
  id: number;
  numero: number;
  status: string;
  categoria: string;
  descricao: string;
  dataServico: string;
  observacoes?: string | null;
  createdAt: string;
  veiculoId: number;
};

type OrcamentoItem = {
  id: number;
  descricao: string;
  qtd: number;
  precoUnit: number;
  valorLinha: number;
  orcamentoId: number;
};

type Orcamento = {
  id: number;
  numero: number;
  total: number;
  createdAt: string;
  veiculoId: number;
  registroTecnico?: { id: number; numero: number } | null;
  itens: OrcamentoItem[];
};

type TimelineEvento =
  | { tipo: "registro"; data: string; id: number; categoria: string; descricao: string; observacoes: string | null }
  | { tipo: "orcamento"; data: string; id: number; numero: number; total: number };

const STATUS_COR: Record<string, string> = {
  "Aberta":            "#f59e0b",
  "Em andamento":      "#60a5fa",
  "Aguardando peças":  "#a78bfa",
  "Concluída":         "#4ade80",
  "Cancelada":         "#f87171",
};

export default function VeiculoDetalhe() {
  const { id } = useParams();
  const veiculoId = Number(id);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"registros" | "orcamentos" | "timeline">("registros");

  const { data: veiculo, isLoading: loadingVeiculo } = useQuery<Veiculo>({
    queryKey: ["veiculo", veiculoId],
    queryFn: async () => {
      try {
        const res = await api.get<Veiculo>(`/veiculos/${veiculoId}`);
        return res.data;
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? "Erro ao carregar veículo.");
        throw error;
      }
    },
    enabled: !!veiculoId,
  });

  const { data: registros = [] } = useQuery<RegistroTecnico[]>({
    queryKey: ["veiculo-registros", veiculoId],
    queryFn: () =>
      api.get<RegistroTecnico[]>("/registroTecnico", { params: { veiculoId } }).then((r) => r.data),
    enabled: !!veiculoId,
  });

  const { data: orcamentos = [] } = useQuery<Orcamento[]>({
    queryKey: ["veiculo-orcamentos", veiculoId],
    queryFn: () =>
      api.get<Orcamento[]>("/orcamento", { params: { veiculoId } }).then((r) => r.data),
    enabled: !!veiculoId,
  });

  const { data: timeline = [], isLoading: loadingTimeline } = useQuery<TimelineEvento[]>({
    queryKey: ["veiculo-timeline", veiculoId],
    queryFn: async () => {
      try {
        const res = await api.get<TimelineEvento[]>(`/veiculos/${veiculoId}/timeline`);
        return res.data;
      } catch {
        toast.error("Erro ao carregar timeline.");
        throw new Error("Erro ao carregar timeline.");
      }
    },
    enabled: !!veiculoId && activeTab === "timeline",
  });

  const loading = loadingVeiculo;

  async function handlePdf(orcamentoId: number) {
    const toastId = toast.loading("Gerando PDF...");
    try {
      const res = await api.get(`/orcamento/${orcamentoId}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      toast.success("PDF aberto!", { id: toastId });
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao gerar PDF.", { id: toastId });
    }
  }

  function formatPtBr(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  if (loading) return <SkeletonCard lines={4} />;
  if (!veiculo) return <div className="card">Veículo não encontrado.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h2">Detalhe do Veículo</h2>
          <div style={{ fontSize: 20, fontWeight: 900 }}>
            {veiculo.modelo} ({veiculo.placa})
          </div>

          <div className="sub">
            Cliente:{" "}
            <Link to={`/clientes/${veiculo.clienteId}`} style={{ textDecoration: "none", fontWeight: 900 }}>
              {veiculo.cliente?.nome ?? `Cliente #${veiculo.clienteId}`}
            </Link>
          </div>

          <div className="sub">
            Ano: {veiculo.ano ?? "-"} | Motor: {veiculo.motor ?? "-"} | Alimentação: {veiculo.alimentacao ?? "-"}
          </div>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btnPrimary"
            type="button"
            onClick={() => navigate("/entrada")}
          >
            + Entrada de Veículo
          </button>

          <Link to="/veiculos" className="btn">
            Voltar
          </Link>
        </div>
      </div>

      {/* TABS */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "registros" ? "active" : ""}`}
          onClick={() => setActiveTab("registros")}
          type="button"
        >
          OS <span className="badge" style={{ marginLeft: 6 }}>{registros.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "orcamentos" ? "active" : ""}`}
          onClick={() => setActiveTab("orcamentos")}
          type="button"
        >
          Orçamentos <span className="badge" style={{ marginLeft: 6 }}>{orcamentos.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "timeline" ? "active" : ""}`}
          onClick={() => setActiveTab("timeline")}
          type="button"
        >
          Timeline
        </button>
      </div>

      {/* ABA: REGISTROS / OS */}
      {activeTab === "registros" && (
        <div className="card">
          {registros.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
              <div className="sub" style={{ marginBottom: 12 }}>Nenhuma OS encontrada para este veículo.</div>
              <button className="btn btnPrimary" type="button" onClick={() => navigate("/entrada")}>
                + Entrada de Veículo
              </button>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="table table-min-md table-cards">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const cor = STATUS_COR[r.status] ?? "#8b8d9e";
                    return (
                      <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/registros/${r.id}`)}>
                        <td data-label="#" style={{ fontWeight: 900 }}>OS-{r.numero}</td>
                        <td data-label="Status">
                          <span className="badge" style={{ color: cor, borderColor: cor, background: `${cor}18` }}>
                            {r.status}
                          </span>
                        </td>
                        <td data-label="Categoria"><span className="badge">{r.categoria}</span></td>
                        <td data-label="Descrição">{r.descricao}</td>
                        <td data-label="Data">{formatPtBr(r.dataServico)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA: ORÇAMENTOS */}
      {activeTab === "orcamentos" && (
        <div className="card">
          {orcamentos.length === 0 ? (
            <div className="sub" style={{ padding: "1rem 0" }}>Nenhum orçamento encontrado.</div>
          ) : (
            <div className="table-scroll">
              <table className="table table-min-md table-cards">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>OS</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th style={{ width: 160 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamentos.map((o) => (
                    <tr key={o.id}>
                      <td data-label="Número" style={{ fontWeight: 900 }}>#{o.numero}</td>
                      <td data-label="OS">
                        {o.registroTecnico ? (
                          <Link
                            to={`/registros/${o.registroTecnico.id}`}
                            style={{ fontWeight: 700, textDecoration: "none", color: "#f59e0b" }}
                          >
                            OS-{o.registroTecnico.numero}
                          </Link>
                        ) : "—"}
                      </td>
                      <td data-label="Data">{formatPtBr(o.createdAt)}</td>
                      <td data-label="Total">R$ {Number(o.total).toFixed(2)}</td>
                      <td>
                        <div className="action-group">
                          <button className="btn btnPrimary" onClick={() => handlePdf(o.id)} type="button">
                            PDF
                          </button>
                          {o.registroTecnico && (
                            <Link to={`/registros/${o.registroTecnico.id}`} className="btn">
                              Ver OS
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA: TIMELINE */}
      {activeTab === "timeline" && (
        <div className="card">
          {loadingTimeline ? (
            <div className="sub">Carregando timeline...</div>
          ) : timeline.length === 0 ? (
            <div className="sub" style={{ padding: "1rem 0" }}>Nenhum evento registrado ainda.</div>
          ) : (
            <div className="timeline">
              {timeline.map((ev, i) => (
                <div key={`${ev.tipo}-${ev.id}`} className="timeline-item">
                  <div className={`timeline-dot ${ev.tipo === "registro" ? "dot-registro" : "dot-orcamento"}`} />
                  {i < timeline.length - 1 && <div className="timeline-line" />}
                  <div className="timeline-body">
                    <div className="timeline-date">{formatPtBr(ev.data)}</div>
                    {ev.tipo === "registro" ? (
                      <>
                        <span className="badge" style={{ marginBottom: 4 }}>{ev.categoria}</span>
                        <div style={{ fontWeight: 700 }}>{ev.descricao}</div>
                        {ev.observacoes && <div className="sub" style={{ marginTop: 4 }}>{ev.observacoes}</div>}
                      </>
                    ) : (
                      <>
                        <span className="badge badge-green" style={{ marginBottom: 4 }}>Orçamento</span>
                        <div style={{ fontWeight: 700 }}>#{ev.numero} — R$ {Number(ev.total).toFixed(2)}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
