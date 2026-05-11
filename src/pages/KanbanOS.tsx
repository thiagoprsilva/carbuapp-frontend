import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";

type OrcamentoStatus = "Pendente" | "Aprovado" | "Rejeitado" | "Executado";

const COLUNAS: { status: OrcamentoStatus; label: string; cor: string }[] = [
  { status: "Pendente",  label: "Pendente",  cor: "#f59e0b" },
  { status: "Aprovado",  label: "Aprovado",  cor: "#60a5fa" },
  { status: "Executado", label: "Executado", cor: "#4ade80" },
  { status: "Rejeitado", label: "Rejeitado", cor: "#f87171" },
];

type Orcamento = {
  id: number;
  numero: number;
  status: OrcamentoStatus;
  total: number;
  createdAt: string;
  veiculo?: {
    id: number;
    modelo: string;
    placa: string;
    cliente?: { nome: string } | null;
  };
};

function formatPtBr(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function KanbanOS() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [movendo, setMovendo] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<Orcamento[]>("/orcamento");
      setOrcamentos(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao carregar orçamentos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function moverStatus(id: number, novoStatus: OrcamentoStatus) {
    setMovendo(id);
    // Atualiza otimisticamente
    setOrcamentos((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: novoStatus } : o))
    );
    try {
      await api.patch(`/orcamento/${id}/status`, { status: novoStatus });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar status.");
      // Reverte em caso de erro
      await load();
    } finally {
      setMovendo(null);
    }
  }

  const porColuna = (status: OrcamentoStatus) =>
    orcamentos.filter((o) => o.status === status);

  if (loading) return <div className="card">Carregando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h2">Kanban de Orçamentos</h2>
          <div className="sub">Arraste ou mova os orçamentos entre as etapas do fluxo.</div>
        </div>
        <div className="page-header-actions">
          <button className="btn btnGray" onClick={load} type="button">
            Atualizar
          </button>
          <Link to="/orcamentos" className="btn">
            Ver lista
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
                  <div className="kanban-empty">Nenhum orçamento</div>
                ) : (
                  cards.map((o) => (
                    <div key={o.id} className="kanban-card">
                      <div className="kanban-card-num">
                        <span style={{ fontWeight: 900 }}>#{o.numero}</span>
                        <span className="sub" style={{ fontSize: 11 }}>{formatPtBr(o.createdAt)}</span>
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

                      <div className="kanban-card-total">
                        R$ {Number(o.total).toFixed(2)}
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
