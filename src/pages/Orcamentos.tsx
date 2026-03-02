import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

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
  subtotal: number;
  total: number;
  createdAt: string;
  veiculoId: number;
  oficinaId: number;
  itens: OrcamentoItem[];
  veiculo?: Veiculo;
};

export default function Orcamentos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  // CREATE/EDIT state
  const [editingId, setEditingId] = useState<number | null>(null);
  const isEditing = editingId !== null;

  const [veiculoId, setVeiculoId] = useState<number>(0);

  // itens (form)
  const [itemDescricao, setItemDescricao] = useState("");
  const [itemQtd, setItemQtd] = useState<number>(1);
  const [itemPreco, setItemPreco] = useState<number>(0);

  // itens do orçamento em edição/criação
  const [itensDraft, setItensDraft] = useState<
    Array<{ descricao: string; qtd: number; precoUnit: number }>
  >([]);

  const subtotalDraft = useMemo(() => {
    return itensDraft.reduce(
      (acc, it) => acc + (Number(it.qtd) || 0) * (Number(it.precoUnit) || 0),
      0
    );
  }, [itensDraft]);

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

  useEffect(() => {
    refresh();
  }, []);

  function resetForm() {
    setEditingId(null);
    if (veiculos.length > 0) setVeiculoId(veiculos[0].id);
    setItemDescricao("");
    setItemQtd(1);
    setItemPreco(0);
    setItensDraft([]);
  }

  function addItem() {
    if (!itemDescricao.trim()) {
      alert("Descrição do item é obrigatória.");
      return;
    }
    if (!itemQtd || itemQtd <= 0) {
      alert("Qtd deve ser maior que 0.");
      return;
    }
    if (itemPreco < 0) {
      alert("Preço unitário inválido.");
      return;
    }

    setItensDraft((prev) => [
      ...prev,
      {
        descricao: itemDescricao.trim(),
        qtd: Number(itemQtd),
        precoUnit: Number(itemPreco),
      },
    ]);

    setItemDescricao("");
    setItemQtd(1);
    setItemPreco(0);
  }

  function removeItem(index: number) {
    setItensDraft((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    if (!veiculoId) return alert("Selecione um veículo.");
    if (itensDraft.length === 0) return alert("Adicione pelo menos 1 item.");

    try {
      const res = await api.post<Orcamento>("/orcamento", {
        veiculoId,
        itens: itensDraft,
      });

      alert(`Orçamento #${res.data.numero} criado!`);
      resetForm();
      await loadOrcamentos();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao criar orçamento.");
    }
  }

  function startEdit(o: Orcamento) {
    setEditingId(o.id);
    setVeiculoId(o.veiculoId);

    // converte itens do banco -> draft
    setItensDraft(
      o.itens.map((it) => ({
        descricao: it.descricao,
        qtd: it.qtd,
        precoUnit: it.precoUnit,
      }))
    );
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!veiculoId) return alert("Selecione um veículo.");
    if (itensDraft.length === 0) return alert("Adicione pelo menos 1 item.");

    try {
      await api.put(`/orcamento/${editingId}`, {
        veiculoId,
        itens: itensDraft,
      });

      alert("Orçamento atualizado!");
      resetForm();
      await loadOrcamentos();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao atualizar orçamento.");
    }
  }

  async function handleDelete(id: number) {
    const ok = confirm("Tem certeza que deseja remover este orçamento?");
    if (!ok) return;

    try {
      await api.delete(`/orcamento/${id}`);
      await loadOrcamentos();
      if (editingId === id) resetForm();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao remover orçamento.");
    }
  }

  async function handlePdf(id: number, numero: number) {
    try {
      const res = await api.get(`/orcamento/${id}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // abre em nova aba (mais prático pra testar)
      window.open(url, "_blank");

      // limpa depois de um tempo
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao gerar PDF.");
    }
  }

  // ✅ integra: gerar registro técnico a partir do orçamento
  function todayYYYYMMDD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function buildDescricaoFromOrcamento(o: Orcamento) {
    const linhas = o.itens.map((it) => {
      return `- ${it.descricao} (${it.qtd}x R$ ${Number(it.precoUnit).toFixed(
        2
      )}) = R$ ${Number(it.valorLinha).toFixed(2)}`;
    });

    return `Registro gerado do Orçamento #${o.numero}\n` + linhas.join("\n");
  }

  async function gerarRegistroDoOrcamento(o: Orcamento) {
    try {
      const defaultCategoria = "Manutenção";
      const defaultData = todayYYYYMMDD();
      const defaultDescricao = buildDescricaoFromOrcamento(o);

      const categoria =
        prompt("Categoria do Registro Técnico:", defaultCategoria) ?? "";
      if (!categoria.trim()) return;

      const dataServico =
        prompt("Data do serviço (YYYY-MM-DD):", defaultData) ?? "";
      if (!dataServico.trim()) return;

      const descricao =
        prompt("Descrição (pode ajustar):", defaultDescricao) ?? "";
      if (!descricao.trim()) return;

      await api.post("/registroTecnico", {
        veiculoId: o.veiculoId,
        categoria,
        descricao,
        dataServico,
        observacoes: `Gerado a partir do Orçamento #${o.numero}`,
        orcamentoId: o.id,
      });

      alert("Registro técnico gerado e vinculado ao orçamento!");
    } catch (error: any) {
      alert(
        error?.response?.data?.message ??
          "Erro ao gerar registro técnico a partir do orçamento."
      );
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 14 }}>Orçamentos</h2>

      {/* FORM */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          padding: 14,
          borderRadius: 6,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {isEditing ? `Editando Orçamento #${editingId}` : "Novo Orçamento"}
        </h3>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <label style={{ fontWeight: 600 }}>Veículo</label>

          <select
            value={veiculoId}
            onChange={(e) => setVeiculoId(Number(e.target.value))}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "#fff",
              minWidth: 320,
            }}
          >
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.modelo} ({v.placa}) — {v.cliente?.nome ?? "Sem cliente"}
              </option>
            ))}
          </select>

          {isEditing && (
            <button
              onClick={resetForm}
              style={{
                padding: "10px 14px",
                borderRadius: 4,
                border: "1px solid #ddd",
              }}
            >
              Cancelar edição
            </button>
          )}
        </div>

        {/* Add item */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            placeholder="Descrição do item"
            value={itemDescricao}
            onChange={(e) => setItemDescricao(e.target.value)}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "#fff",
              width: 360,
            }}
          />

          <input
            type="number"
            placeholder="Qtd"
            value={itemQtd}
            onChange={(e) => setItemQtd(Number(e.target.value))}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "#fff",
              width: 100,
            }}
            min={1}
          />

          <input
            type="number"
            placeholder="Preço unit."
            value={itemPreco}
            onChange={(e) => setItemPreco(Number(e.target.value))}
            style={{
              padding: 10,
              border: "1px solid #ccc",
              borderRadius: 4,
              background: "#fff",
              width: 140,
            }}
            min={0}
            step="0.01"
          />

          <button
            onClick={addItem}
            style={{
              padding: "10px 14px",
              borderRadius: 4,
              background: "#111827",
              color: "#fff",
              border: "none",
            }}
          >
            Adicionar item
          </button>
        </div>

        {/* Items table */}
        <table style={{ width: "100%", border: "1px solid #eee", marginBottom: 10 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>
                Descrição
              </th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>
                Qtd
              </th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>
                Unit
              </th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>
                Total
              </th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {itensDraft.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 12, opacity: 0.7 }}>
                  Nenhum item adicionado.
                </td>
              </tr>
            ) : (
              itensDraft.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{it.descricao}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{it.qtd}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    R$ {Number(it.precoUnit).toFixed(2)}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    R$ {(Number(it.qtd) * Number(it.precoUnit)).toFixed(2)}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    <button
                      onClick={() => removeItem(idx)}
                      style={{
                        padding: "8px 12px",
                        background: "#dc2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                      }}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>Subtotal/Total: R$ {subtotalDraft.toFixed(2)}</div>

          {isEditing ? (
            <button
              onClick={handleUpdate}
              style={{
                padding: "10px 14px",
                borderRadius: 4,
                background: "#2563eb",
                color: "#fff",
                border: "none",
              }}
            >
              Salvar alterações
            </button>
          ) : (
            <button
              onClick={handleCreate}
              style={{
                padding: "10px 14px",
                borderRadius: 4,
                background: "#111827",
                color: "#fff",
                border: "none",
              }}
            >
              Criar orçamento
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <table style={{ width: "100%", background: "#fff", border: "1px solid #eee" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Número</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Cliente</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Veículo</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Total</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Data</th>
            <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orcamentos.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: 12, opacity: 0.7 }}>
                Nenhum orçamento cadastrado.
              </td>
            </tr>
          ) : (
            orcamentos.map((o) => (
              <tr key={o.id}>
                <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{o.numero}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                  {o.veiculo?.cliente?.nome ?? "-"}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                  {o.veiculo ? `${o.veiculo.modelo} (${o.veiculo.placa})` : `Veículo #${o.veiculoId}`}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>R$ {Number(o.total).toFixed(2)}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{formatDate(o.createdAt)}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => startEdit(o)}
                      style={{
                        padding: "8px 12px",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                      }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handlePdf(o.id, o.numero)}
                      style={{
                        padding: "8px 12px",
                        background: "#111827",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                      }}
                    >
                      PDF
                    </button>

                    <button
                      onClick={() => gerarRegistroDoOrcamento(o)}
                      style={{
                        padding: "8px 12px",
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                      }}
                    >
                      Gerar Registro
                    </button>

                    <button
                      onClick={() => handleDelete(o.id)}
                      style={{
                        padding: "8px 12px",
                        background: "#dc2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}