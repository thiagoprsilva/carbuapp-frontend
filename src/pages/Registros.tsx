import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

type Veiculo = {
  id: number;
  placa: string;
  modelo: string;
  cliente?: { nome: string } | null;
};

type OS = {
  id: number;
  numero: number;
  status: string;
  categoria: string;
  descricao: string;
  dataServico: string;
  observacoes?: string | null;
  createdAt: string;
  veiculoId: number;
  veiculo?: Veiculo | null;
};

const STATUS_COR: Record<string, string> = {
  "Aberta":            "#f59e0b",
  "Em andamento":      "#60a5fa",
  "Aguardando peças":  "#a78bfa",
  "Concluída":         "#4ade80",
  "Cancelada":         "#f87171",
};

function formatPtBr(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function Registros() {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });

  async function loadRegistros() {
    const res = await api.get<OS[]>("/registroTecnico");
    setRegistros(res.data);
  }

  async function refresh() {
    setLoading(true);
    try {
      await loadRegistros();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function pedirConfirmacaoDelete(id: number) {
    setConfirmDelete({ open: true, id });
  }

  async function confirmarDelete() {
    const id = confirmDelete.id;
    setConfirmDelete({ open: false, id: null });
    if (!id) return;

    try {
      await api.delete(`/registroTecnico/${id}`);
      toast.success("OS removida.");
      await loadRegistros();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao remover OS.");
    }
  }

  if (loading) return <div className="card">Carregando...</div>;

  return (
    <div>
      <ConfirmModal
        open={confirmDelete.open}
        title="Remover Ordem de Serviço"
        message="Tem certeza que deseja remover esta OS? Todos os orçamentos e registros vinculados serão removidos."
        confirmLabel="Remover"
        danger
        onConfirm={confirmarDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />

      <div className="page-header">
        <div>
          <h2 className="h2">Ordens de Serviço</h2>
          <div className="sub">Histórico de OS abertas e concluídas na oficina.</div>
        </div>
        <div className="page-header-actions">
          <span className="badge">{registros.length} OS</span>
          <button
            className="btn btnPrimary"
            type="button"
            onClick={() => navigate("/entrada")}
          >
            + Entrada de Veículo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-scroll">
          <table className="table table-min-xl table-cards">
            <thead>
              <tr>
                <th>#</th>
                <th>Status</th>
                <th>Veículo</th>
                <th>Cliente</th>
                <th>Categoria</th>
                <th>Data</th>
                <th style={{ width: 160 }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {registros.length === 0 ? (
                <tr className="row-empty">
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem 1rem" }}>
                    <div style={{ opacity: 0.5, fontSize: 14, marginBottom: 12 }}>
                      Nenhuma OS cadastrada ainda.
                    </div>
                    <button
                      className="btn btnPrimary"
                      type="button"
                      onClick={() => navigate("/entrada")}
                    >
                      + Entrada de Veículo
                    </button>
                  </td>
                </tr>
              ) : (
                registros.map((r) => {
                  const cor = STATUS_COR[r.status] ?? "#8b8d9e";
                  return (
                    <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/registros/${r.id}`)}>
                      <td data-label="#" style={{ fontWeight: 900 }}>
                        OS-{r.numero}
                      </td>

                      <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                        <span
                          className="badge"
                          style={{ color: cor, borderColor: cor, background: `${cor}18` }}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td data-label="Veículo">
                        {r.veiculo
                          ? `${r.veiculo.modelo} (${r.veiculo.placa})`
                          : `Veículo #${r.veiculoId}`}
                      </td>

                      <td data-label="Cliente">
                        {r.veiculo?.cliente?.nome ?? "-"}
                      </td>

                      <td data-label="Categoria">
                        <span className="badge">{r.categoria}</span>
                      </td>

                      <td data-label="Data">{formatPtBr(r.dataServico)}</td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-group">
                          <Link
                            to={`/registros/${r.id}`}
                            className="btn btnBlue"
                          >
                            Abrir
                          </Link>
                          <button
                            onClick={() => pedirConfirmacaoDelete(r.id)}
                            className="btn btnRed"
                            type="button"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
