import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

// ─── tipos ────────────────────────────────────────────────────────────────────

type OrcamentoStatus = "Pendente" | "Aprovado" | "Rejeitado" | "Executado";

const TODOS_OS_STATUS: OrcamentoStatus[] = ["Pendente", "Aprovado", "Rejeitado", "Executado"];

type Cliente = { id: number; nome: string; telefone?: string | null };

type Veiculo = {
  id: number;
  placa: string;
  modelo: string;
  ano?: string | null;
  motor?: string | null;
  alimentacao?: string | null;
  cliente?: Cliente;
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
  status: OrcamentoStatus;
  subtotal: number;
  total: number;
  createdAt: string;
  veiculoId: number;
  oficinaId: number;
  itens: OrcamentoItem[];
  veiculo?: Veiculo;
};

// ─── helpers visuais ──────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function Orcamentos() {
  // dados
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  // filtro de status
  const [filtroStatus, setFiltroStatus] = useState<OrcamentoStatus | "Todos">("Todos");

  // formulário de criação / edição
  const [editingId, setEditingId] = useState<number | null>(null);
  const isEditing = editingId !== null;
  const [veiculoId, setVeiculoId] = useState<number>(0);
  const [itemDescricao, setItemDescricao] = useState("");
  const [itemQtd, setItemQtd] = useState<number>(1);
  const [itemPreco, setItemPreco] = useState<number | "">("");
  const [itensDraft, setItensDraft] = useState<
    { descricao: string; qtd: number; precoUnit: number }[]
  >([]);
  const [saving, setSaving] = useState(false);

  // modal de confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    id: number | null;
    numero: number | null;
  }>({ open: false, id: null, numero: null });

  // ─── subtotal calculado ────────────────────────────────────────────────────
  const subtotalDraft = useMemo(
    () =>
      itensDraft.reduce(
        (acc, it) => acc + (Number(it.qtd) || 0) * (Number(it.precoUnit) || 0),
        0
      ),
    [itensDraft]
  );

  // ─── lista filtrada ────────────────────────────────────────────────────────
  const orcamentosFiltrados = useMemo(() => {
    if (filtroStatus === "Todos") return orcamentos;
    return orcamentos.filter((o) => o.status === filtroStatus);
  }, [orcamentos, filtroStatus]);

  // ─── contadores por status ─────────────────────────────────────────────────
  const contadores = useMemo(() => {
    const base = { Todos: orcamentos.length, Pendente: 0, Aprovado: 0, Rejeitado: 0, Executado: 0 };
    for (const o of orcamentos) {
      if (o.status in base) (base as any)[o.status]++;
    }
    return base;
  }, [orcamentos]);

  // ─── carga de dados ────────────────────────────────────────────────────────
  async function loadVeiculos() {
    const res = await api.get<Veiculo[]>("/veiculos");
    setVeiculos(res.data);
    if (res.data.length > 0) setVeiculoId(res.data[0].id);
  }

  async function loadOrcamentos() {
    const res = await api.get<Orcamento[]>("/orcamento");
    setOrcamentos(res.data);
  }

  async function refresh() {
    setLoading(true);
    try {
      await Promise.all([loadVeiculos(), loadOrcamentos()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  // ─── formulário ───────────────────────────────────────────────────────────
  function resetForm() {
    setEditingId(null);
    if (veiculos.length > 0) setVeiculoId(veiculos[0].id);
    setItemDescricao("");
    setItemQtd(1);
    setItemPreco("");
    setItensDraft([]);
  }

  function addItem() {
    if (!itemDescricao.trim()) {
      toast.error("Informe a descrição do item.");
      return;
    }
    if (!itemQtd || itemQtd <= 0) {
      toast.error("Quantidade deve ser maior que zero.");
      return;
    }

    setItensDraft((prev) => [
      ...prev,
      { descricao: itemDescricao.trim(), qtd: Number(itemQtd), precoUnit: Number(itemPreco) || 0 },
    ]);

    setItemDescricao("");
    setItemQtd(1);
    setItemPreco("");
  }

  function removeItem(index: number) {
    setItensDraft((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    if (!veiculoId) { toast.error("Selecione um veículo."); return; }
    if (itensDraft.length === 0) { toast.error("Adicione pelo menos 1 item."); return; }

    setSaving(true);
    try {
      const res = await api.post<Orcamento>("/orcamento", { veiculoId, itens: itensDraft });
      toast.success(`Orçamento #${res.data.numero} criado!`);
      resetForm();
      await loadOrcamentos();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao criar orçamento.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!veiculoId) { toast.error("Selecione um veículo."); return; }
    if (itensDraft.length === 0) { toast.error("Adicione pelo menos 1 item."); return; }

    setSaving(true);
    try {
      await api.put(`/orcamento/${editingId}`, { veiculoId, itens: itensDraft });
      toast.success("Orçamento atualizado!");
      resetForm();
      await loadOrcamentos();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao atualizar orçamento.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(o: Orcamento) {
    setEditingId(o.id);
    setVeiculoId(o.veiculoId);
    setItensDraft(
      o.itens.map((it) => ({ descricao: it.descricao, qtd: it.qtd, precoUnit: it.precoUnit }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ─── troca rápida de status ────────────────────────────────────────────────
  async function handleStatusChange(id: number, novoStatus: string) {
    try {
      await api.patch(`/orcamento/${id}/status`, { status: novoStatus });
      setOrcamentos((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: novoStatus as OrcamentoStatus } : o))
      );
      toast.success(`Status → "${novoStatus}"`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao alterar status.");
    }
  }

  // ─── exclusão ─────────────────────────────────────────────────────────────
  function pedirConfirmacaoDelete(id: number, numero: number) {
    setConfirmDelete({ open: true, id, numero });
  }

  async function confirmarDelete() {
    const id = confirmDelete.id;
    setConfirmDelete({ open: false, id: null, numero: null });
    if (!id) return;

    try {
      await api.delete(`/orcamento/${id}`);
      setOrcamentos((prev) => prev.filter((o) => o.id !== id));
      if (editingId === id) resetForm();
      toast.success("Orçamento removido.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao remover orçamento.");
    }
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────
  async function handlePdf(id: number) {
    const toastId = toast.loading("Gerando PDF...");
    try {
      const res = await api.get(`/orcamento/${id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      toast.success("PDF aberto!", { id: toastId });
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao gerar PDF.", { id: toastId });
    }
  }

  // ─── gerar registro técnico ───────────────────────────────────────────────
  // TODO Etapa 2: substituir por modal com formulário
  function buildDescricao(o: Orcamento) {
    const linhas = o.itens.map(
      (it) =>
        `- ${it.descricao} (${it.qtd}x R$ ${Number(it.precoUnit).toFixed(2)}) = R$ ${Number(it.valorLinha).toFixed(2)}`
    );
    return `Registro gerado do Orçamento #${o.numero}\n` + linhas.join("\n");
  }

  async function gerarRegistro(o: Orcamento) {
    const toastId = toast.loading("Criando registro técnico...");
    try {
      await api.post("/registroTecnico", {
        veiculoId: o.veiculoId,
        categoria: "Manutenção",
        descricao: buildDescricao(o),
        dataServico: new Date().toISOString().split("T")[0],
        observacoes: `Gerado a partir do Orçamento #${o.numero}`,
        orcamentoId: o.id,
      });
      toast.success("Registro técnico criado!", { id: toastId });
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao gerar registro.", { id: toastId });
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────
  if (loading) return <div className="card">Carregando...</div>;

  return (
    <div>
      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        open={confirmDelete.open}
        title="Remover orçamento"
        message={`Tem certeza que deseja remover o orçamento #${confirmDelete.numero}? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        danger
        onConfirm={confirmarDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null, numero: null })}
      />

      {/* Cabeçalho */}
      <div className="page-header">
        <div>
          <h2 className="h2">Orçamentos</h2>
          <div className="sub">Gerencie orçamentos e acompanhe o status de cada um.</div>
        </div>
        <span className="badge">{orcamentos.length} orçamento(s)</span>
      </div>

      {/* Filtro rápido por status */}
      <div className="status-filter-bar">
        {(["Todos", ...TODOS_OS_STATUS] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`status-filter-btn ${filtroStatus === s ? "active" : ""}`}
            onClick={() => setFiltroStatus(s as typeof filtroStatus)}
          >
            {s}{" "}
            <span style={{ opacity: .7, fontWeight: 600 }}>
              ({contadores[s as keyof typeof contadores] ?? 0})
            </span>
          </button>
        ))}
      </div>

      {/* Formulário de criação / edição */}
      <div className="card card-section">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>
            {isEditing ? `Editando Orçamento #${editingId}` : "Novo Orçamento"}
          </h3>
          {isEditing && (
            <button onClick={resetForm} className="btn btnGray" type="button">
              Cancelar edição
            </button>
          )}
        </div>

        {/* Seleção de veículo */}
        <div className="inline-form" style={{ marginBottom: 12, alignItems: "center" }}>
          <span className="badge">Veículo</span>
          <div className="field-wide">
            <select
              className="select"
              value={veiculoId}
              onChange={(e) => setVeiculoId(Number(e.target.value))}
            >
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.modelo} ({v.placa}) — {v.cliente?.nome ?? "Sem cliente"}
                </option>
              ))}
            </select>
          </div>
          <span className="badge">Subtotal: R$ {subtotalDraft.toFixed(2)}</span>
        </div>

        {/* Linha de item */}
        <div className="inline-form" style={{ marginBottom: 12 }}>
          <div className="field-wide">
            <input
              className="input"
              placeholder="Descrição do item"
              value={itemDescricao}
              onChange={(e) => setItemDescricao(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
            />
          </div>
          <div className="field-compact">
            <input
              className="input"
              type="number"
              placeholder="Qtd."
              aria-label="Quantidade"
              value={itemQtd}
              onChange={(e) => setItemQtd(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="field-medium">
            <input
              className="input"
              type="number"
              placeholder="Valor unit."
              aria-label="Valor unitário"
              value={itemPreco}
              onChange={(e) =>
                setItemPreco(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
              step="0.01"
            />
          </div>
          <button onClick={addItem} className="btn btnPrimary" type="button">
            + Adicionar
          </button>
        </div>

        {/* Lista de itens em draft */}
        <div className="item-list" style={{ marginBottom: 12 }}>
          {itensDraft.length === 0 ? (
            <div style={{ padding: "10px 0", opacity: .6, fontSize: 14 }}>
              Nenhum item adicionado. Use o campo acima ou pressione Enter.
            </div>
          ) : (
            itensDraft.map((it, idx) => (
              <div key={idx} className="card" style={{ padding: 12 }}>
                <div className="item-row">
                  <div>
                    <div style={{ fontWeight: 800 }}>{it.descricao}</div>
                    <div className="sub">Item #{idx + 1}</div>
                  </div>
                  <span className="badge">Qtd: {it.qtd}</span>
                  <span className="badge">Unit: R$ {Number(it.precoUnit).toFixed(2)}</span>
                  <span className="badge">= R$ {(it.qtd * it.precoUnit).toFixed(2)}</span>
                  <button onClick={() => removeItem(idx)} className="btn btnRed" type="button">
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé do formulário */}
        <div className="summary-line">
          <div className="sub">
            Total estimado: <b>R$ {subtotalDraft.toFixed(2)}</b>
          </div>
          {isEditing ? (
            <button onClick={handleUpdate} className="btn btnBlue" type="button" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          ) : (
            <button onClick={handleCreate} className="btn btnPrimary" type="button" disabled={saving}>
              {saving ? "Criando..." : "Criar orçamento"}
            </button>
          )}
        </div>
      </div>

      {/* Tabela de orçamentos */}
      <div className="card">
        {orcamentosFiltrados.length === 0 ? (
          <div style={{ padding: 16, opacity: .7, fontSize: 14 }}>
            {filtroStatus === "Todos"
              ? "Nenhum orçamento cadastrado."
              : `Nenhum orçamento com status "${filtroStatus}".`}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table table-min-xl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Veículo</th>
                  <th>Total</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th style={{ width: 240 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentosFiltrados.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 900 }}>#{o.numero}</td>
                    <td>{o.veiculo?.cliente?.nome ?? "—"}</td>
                    <td>
                      {o.veiculo
                        ? `${o.veiculo.modelo} (${o.veiculo.placa})`
                        : `Veículo #${o.veiculoId}`}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      R$ {Number(o.total).toFixed(2)}
                    </td>
                    <td>{formatDate(o.createdAt)}</td>

                    {/* Status — dropdown colorido inline */}
                    <td>
                      <select
                        className={`status-select status-${o.status}`}
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        aria-label={`Status do orçamento #${o.numero}`}
                      >
                        {TODOS_OS_STATUS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* Ações */}
                    <td>
                      <div className="action-group">
                        <button
                          onClick={() => startEdit(o)}
                          className="btn btnBlue"
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handlePdf(o.id)}
                          className="btn btnPrimary"
                          type="button"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => gerarRegistro(o)}
                          type="button"
                          className="btn"
                          style={{ background: "#16a34a", borderColor: "#16a34a", color: "#fff" }}
                        >
                          Registro
                        </button>
                        <button
                          onClick={() => pedirConfirmacaoDelete(o.id, o.numero)}
                          className="btn btnRed"
                          type="button"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
