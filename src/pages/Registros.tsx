import { useEffect, useState } from "react";
import { api } from "../services/api";

type Veiculo = {
  id: number;
  placa: string;
  modelo: string;
  cliente?: { nome: string };
};

type RegistroTecnico = {
  id: number;
  categoria: string;
  descricao: string;
  dataServico: string;
  observacoes?: string | null;
  createdAt: string;
  veiculoId: number;
  veiculo?: Veiculo;
};

const categoriasFixas = ["Revisão", "Manutenção", "Personalização", "Projeto", "Diagnóstico"];

function isoToDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPtBr(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function Registros() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [registros, setRegistros] = useState<RegistroTecnico[]>([]);
  const [veiculoId, setVeiculoId] = useState<number>(0);
  const [categoria, setCategoria] = useState(categoriasFixas[0]);
  const [descricao, setDescricao] = useState("");
  const [dataServico, setDataServico] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVeiculoId, setEditVeiculoId] = useState<number>(0);
  const [editCategoria, setEditCategoria] = useState(categoriasFixas[0]);
  const [editDescricao, setEditDescricao] = useState("");
  const [editDataServico, setEditDataServico] = useState("");
  const [editObservacoes, setEditObservacoes] = useState("");

  async function loadVeiculos() {
    const res = await api.get<Veiculo[]>("/veiculos");
    setVeiculos(res.data);
    if (res.data.length > 0) setVeiculoId(res.data[0].id);
  }

  async function loadRegistros() {
    const res = await api.get<RegistroTecnico[]>("/registroTecnico");
    setRegistros(res.data);
  }

  async function refresh() {
    setLoading(true);
    try {
      await Promise.all([loadVeiculos(), loadRegistros()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!veiculoId) return alert("Selecione um veículo.");
    if (!descricao.trim() || !dataServico.trim()) return alert("Descrição e data são obrigatórias.");

    setCreating(true);
    try {
      await api.post("/registroTecnico", {
        veiculoId,
        categoria,
        descricao: descricao.trim(),
        dataServico,
        observacoes: observacoes.trim() || null,
      });

      setDescricao("");
      setObservacoes("");
      setDataServico("");
      await loadRegistros();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao criar registro técnico.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(r: RegistroTecnico) {
    setEditId(r.id);
    setEditVeiculoId(r.veiculoId);
    setEditCategoria(r.categoria);
    setEditDescricao(r.descricao);
    setEditDataServico(isoToDateInput(r.dataServico));
    setEditObservacoes(r.observacoes ?? "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditVeiculoId(0);
    setEditCategoria(categoriasFixas[0]);
    setEditDescricao("");
    setEditDataServico("");
    setEditObservacoes("");
  }

  async function saveEdit(id: number) {
    if (!editVeiculoId) return alert("Selecione um veículo.");
    if (!editDescricao.trim() || !editDataServico.trim()) return alert("Descrição e data são obrigatórias.");

    try {
      await api.put(`/registroTecnico/${id}`, {
        veiculoId: editVeiculoId,
        categoria: editCategoria,
        descricao: editDescricao.trim(),
        dataServico: editDataServico,
        observacoes: editObservacoes.trim() || null,
      });

      cancelEdit();
      await loadRegistros();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao editar registro técnico.");
    }
  }

  async function handleDelete(id: number) {
    const ok = confirm("Tem certeza que deseja remover este registro técnico?");
    if (!ok) return;

    try {
      await api.delete(`/registroTecnico/${id}`);
      await loadRegistros();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao remover registro técnico.");
    }
  }

  if (loading) return <div className="card">Carregando...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h2">Histórico Técnico</h2>
          <div className="sub">Registre serviços, manutenção e observações por veículo.</div>
        </div>
        <span className="badge">{registros.length} registro(s)</span>
      </div>

      <div className="card card-section">
        <form onSubmit={handleCreate} className="inline-form">
          <div className="field-wide">
            <select
              className="select"
              value={veiculoId}
              onChange={(e) => setVeiculoId(Number(e.target.value))}
              disabled={veiculos.length === 0}
            >
              {veiculos.length === 0 ? (
                <option value={0}>Nenhum veículo cadastrado</option>
              ) : (
                veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.modelo} ({v.placa})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="field-medium">
            <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categoriasFixas.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="field-medium">
            <input className="input" type="date" value={dataServico} onChange={(e) => setDataServico(e.target.value)} />
          </div>

          <div className="field-wide">
            <input
              className="input"
              placeholder="Descrição do serviço realizado"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="field-wide">
            <input
              className="input"
              placeholder="Observações (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <button type="submit" disabled={creating || veiculos.length === 0} className="btn btnPrimary">
            {creating ? "Salvando..." : "Registrar"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="table-scroll">
          <table className="table table-min-xl">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Data</th>
                <th>Obs</th>
                <th style={{ width: 260 }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12, opacity: 0.7 }}>
                    Nenhum registro cadastrado.
                  </td>
                </tr>
              ) : (
                registros.map((r) => {
                  const editing = editId === r.id;

                  return (
                    <tr key={r.id}>
                      <td>
                        {editing ? (
                          <select className="select" value={editVeiculoId} onChange={(e) => setEditVeiculoId(Number(e.target.value))}>
                            {veiculos.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.modelo} ({v.placa})
                              </option>
                            ))}
                          </select>
                        ) : r.veiculo ? (
                          `${r.veiculo.modelo} (${r.veiculo.placa})`
                        ) : (
                          `Veículo #${r.veiculoId}`
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <select className="select" value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)}>
                            {categoriasFixas.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        ) : (
                          r.categoria
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <input className="input" value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
                        ) : (
                          r.descricao
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <input className="input" type="date" value={editDataServico} onChange={(e) => setEditDataServico(e.target.value)} />
                        ) : (
                          formatPtBr(r.dataServico)
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <input className="input" value={editObservacoes} onChange={(e) => setEditObservacoes(e.target.value)} />
                        ) : (
                          r.observacoes ?? "-"
                        )}
                      </td>

                      <td>
                        {editing ? (
                          <div className="action-group">
                            <button onClick={() => saveEdit(r.id)} className="btn btnPrimary" type="button">
                              Salvar
                            </button>
                            <button onClick={cancelEdit} className="btn btnGray" type="button">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="action-group">
                            <button onClick={() => startEdit(r)} className="btn btnBlue" type="button">
                              Editar
                            </button>
                            <button onClick={() => handleDelete(r.id)} className="btn btnRed" type="button">
                              Excluir
                            </button>
                          </div>
                        )}
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
