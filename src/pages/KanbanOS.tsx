import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { SkeletonCard } from "../components/Skeleton";

type OSStatus = "Aberta" | "Em andamento" | "Aguardando peças" | "Concluída" | "Cancelada";

const COLUNAS: { status: OSStatus; label: string; cor: string }[] = [
  { status: "Aberta",           label: "Aberta",           cor: "#f59e0b" },
  { status: "Em andamento",     label: "Em andamento",     cor: "#60a5fa" },
  { status: "Aguardando peças", label: "Aguardando peças", cor: "#a78bfa" },
  { status: "Concluída",        label: "Concluída",        cor: "#4ade80" },
  { status: "Cancelada",        label: "Cancelada",        cor: "#f87171" },
];

type OS = {
  id: number;
  numero: number;
  status: OSStatus;
  categoria: string;
  descricao: string;
  dataServico: string;
  createdAt: string;
  veiculo?: {
    id: number;
    modelo: string;
    placa: string;
    cliente?: { nome: string } | null;
  } | null;
};

function formatPtBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function KanbanOS() {
  const queryClient = useQueryClient();
  const [movendo, setMovendo] = useState<number | null>(null);

  const { data: ordens = [], isLoading: loading } = useQuery<OS[]>({
    queryKey: ["kanban-os"],
    queryFn: async () => {
      try {
        const res = await api.get<OS[]>("/registroTecnico");
        return res.data;
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Erro ao carregar ordens.");
        throw err;
      }
    },
  });

  function load() {
    queryClient.invalidateQueries({ queryKey: ["kanban-os"] });
  }

  async function moverStatus(id: number, novoStatus: OSStatus) {
    setMovendo(id);
    // Atualiza otimisticamente
    queryClient.setQueryData<OS[]>(["kanban-os"], (prev) =>
      prev ? prev.map((o) => (o.id === id ? { ...o, status: novoStatus } : o)) : prev
    );
    try {
      await api.patch(`/registroTecnico/${id}/status`, { status: novoStatus });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar status.");
      queryClient.invalidateQueries({ queryKey: ["kanban-os"] });
    } finally {
      setMovendo(null);
    }
  }

  const porColuna = (status: OSStatus) =>
    ordens.filter((o) => o.status === status);

  if (loading) return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ flex: "1 1 180px", minWidth: 160 }}>
          <SkeletonCard lines={4} />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h2">Kanban de OS</h2>
          <div className="sub">Mova as ordens de serviço entre as etapas do fluxo.</div>
        </div>
        <div className="page-header-actions">
          <button className="btn btnGray" onClick={load} type="button">
            Atualizar
          </button>
          <Link to="/registros" className="btn">
            Ver lista
          </Link>
          <Link to="/entrada" className="btn btnPrimary">
            + Entrada
          </Link>
        </div>
      </div>

      <div className="kanban-board">
        {COLUNAS.map(({ status, label, cor }) => {
          const cards = porColuna(status);
          const ORDEM = COLUNAS.map((c) => c.status);
          const idxAtual = ORDEM.indexOf(status);

          return (
            <div key={status} className="kanban-col">
              {/* Cabeçalho da coluna */}
              <div className="kanban-col-header">
                <span className="kanban-col-dot" style={{ background: cor }} />
                <span className="kanban-col-label">{label}</span>
                <span className="badge" style={{ marginLeft: "auto" }}>{cards.length}</span>
              </div>

              {/* Cards */}
              <div className="kanban-cards">
                {cards.length === 0 ? (
                  <div className="kanban-empty">Nenhuma OS</div>
                ) : (
                  cards.map((o) => (
                    <div key={o.id} className="kanban-card">
                      <div className="kanban-card-num">
                        <Link
                          to={`/registros/${o.id}`}
                          style={{ fontWeight: 900, textDecoration: "none" }}
                        >
                          OS-{o.numero}
                        </Link>
                        <span className="sub" style={{ fontSize: 11 }}>{formatPtBr(o.createdAt)}</span>
                      </div>

                      <div className="sub" style={{ fontSize: 11, marginBottom: 2 }}>
                        {o.categoria}
                      </div>

                      {o.veiculo && (
                        <Link
                          to={`/veiculos/${o.veiculo.id}`}
                          className="kanban-card-veiculo"
                          style={{ textDecoration: "none" }}
                        >
                          {o.veiculo.modelo} ({o.veiculo.placa})
                        </Link>
                      )}

                      {o.veiculo?.cliente && (
                        <div className="kanban-card-cliente">
                          {o.veiculo.cliente.nome}
                        </div>
                      )}

                      <div
                        className="sub"
                        style={{ fontSize: 12, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                        title={o.descricao}
                      >
                        {o.descricao}
                      </div>

                      {/* Botões de mover */}
                      <div className="kanban-card-actions">
                        {idxAtual > 0 && (
                          <button
                            className="btn kanban-move-btn"
                            type="button"
                            disabled={movendo === o.id}
                            onClick={() => moverStatus(o.id, ORDEM[idxAtual - 1])}
                            title={`Mover para ${COLUNAS[idxAtual - 1].label}`}
                          >
                            ← {COLUNAS[idxAtual - 1].label}
                          </button>
                        )}
                        {idxAtual < ORDEM.length - 1 && (
                          <button
                            className="btn btnPrimary kanban-move-btn"
                            type="button"
                            disabled={movendo === o.id}
                            onClick={() => moverStatus(o.id, ORDEM[idxAtual + 1])}
                            title={`Mover para ${COLUNAS[idxAtual + 1].label}`}
                          >
                            {COLUNAS[idxAtual + 1].label} →
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
