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
  dataServico: string; // ISO vindo do backend
  observacoes?: string | null;
  createdAt: string;
  veiculoId: number;
  veiculo?: Veiculo;
};

const categoriasFixas = ["Revisão", "Manutenção", "Personalização", "Projeto", "Diagnóstico"];

/** converte ISO -> "YYYY-MM-DD" (para input type="date") */
function isoToDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  // Ajuste simples para evitar "dia anterior" em alguns fusos:
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** formata ISO para pt-BR */
function formatPtBr(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function Registros() {
  // listagens
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [registros, setRegistros] = useState<RegistroTecnico[]>([]);

  // create form
  const [veiculoId, setVeiculoId] = useState<number>(0);
  const [categoria, setCategoria] = useState(categoriasFixas[0]);
  const [descricao, setDescricao] = useState("");
  const [dataServico, setDataServico] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // edit mode
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

  // CREATE
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
        dataServico, // YYYY-MM-DD
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

  // ENTER EDIT
  function startEdit(r: RegistroTecnico) {
    setEditId(r.id);
    setEditVeiculoId(r.veiculoId);
    setEditCategoria(r.categoria);
    setEditDescricao(r.descricao);
    setEditDataServico(isoToDateInput(r.dataServico)); // ISO -> date input
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

  // UPDATE
  async function saveEdit(id: number) {
    if (!editVeiculoId) return alert("Selecione um veículo.");
    if (!editDescricao.trim() || !editDataServico.trim()) return alert("Descrição e data são obrigatórias.");

    try {
      await api.put(`/registroTecnico/${id}`, {
        veiculoId: editVeiculoId,
        categoria: editCategoria,
        descricao: editDescricao.trim(),
        dataServico: editDataServico, // YYYY-MM-DD
        observacoes: editObservacoes.trim() || null,
      });

      cancelEdit();
      await loadRegistros();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao editar registro técnico.");
    }
  }

  // DELETE
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

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 14 }}>Histórico Técnico</h2>

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <select
          value={veiculoId}
          onChange={(e) => setVeiculoId(Number(e.target.value))}
          disabled={veiculos.length === 0}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", minWidth: 260 }}
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

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", minWidth: 180 }}
        >
          {categoriasFixas.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dataServico}
          onChange={(e) => setDataServico(e.target.value)}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff" }}
        />

        <input
          placeholder="Descrição do serviço realizado"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 360 }}
        />

        <input
          placeholder="Observações (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 260 }}
        />

        <button
          type="submit"
          disabled={creating || veiculos.length === 0}
          style={{
            padding: "10px 16px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {creating ? "Salvando..." : "Registrar"}
        </button>
      </form>

      {/* LIST */}
      <table style={{ width: "100%", background: "#fff", border: "1px solid #eee" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Veículo</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Categoria</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Descrição</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Data</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Obs</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Ações</th>
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
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {editing ? (
                      <select
                        value={editVeiculoId}
                        onChange={(e) => setEditVeiculoId(Number(e.target.value))}
                        style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4, background: "#fff", minWidth: 240 }}
                      >
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

                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {editing ? (
                      <select
                        value={editCategoria}
                        onChange={(e) => setEditCategoria(e.target.value)}
                        style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4, background: "#fff" }}
                      >
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

                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {editing ? (
                      <input
                        value={editDescricao}
                        onChange={(e) => setEditDescricao(e.target.value)}
                        style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 360 }}
                      />
                    ) : (
                      r.descricao
                    )}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {editing ? (
                      <input
                        type="date"
                        value={editDataServico}
                        onChange={(e) => setEditDataServico(e.target.value)}
                        style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4, background: "#fff" }}
                      />
                    ) : (
                      formatPtBr(r.dataServico)
                    )}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {editing ? (
                      <input
                        value={editObservacoes}
                        onChange={(e) => setEditObservacoes(e.target.value)}
                        style={{ padding: 8, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 240 }}
                      />
                    ) : (
                      r.observacoes ?? "-"
                    )}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {editing ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => saveEdit(r.id)}
                          style={{
                            padding: "8px 12px",
                            background: "#111827",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Salvar
                        </button>

                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: "8px 12px",
                            background: "#e5e7eb",
                            color: "#111827",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => startEdit(r)}
                          style={{
                            padding: "8px 12px",
                            background: "#2563eb",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => handleDelete(r.id)}
                          style={{
                            padding: "8px 12px",
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                          }}
                        >
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
  );
}