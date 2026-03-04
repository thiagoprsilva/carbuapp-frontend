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
  const [itensDraft, setItensDraft] = useState<Array<{ descricao: string; qtd: number; precoUnit: number }>>([]);

  const subtotalDraft = useMemo(() => {
    return itensDraft.reduce((acc, it) => acc + (Number(it.qtd) || 0) * (Number(it.precoUnit) || 0), 0);
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
    if (!itemDescricao.trim()) return alert("Descrição do item é obrigatória.");
    if (!itemQtd || itemQtd <= 0) return alert("Qtd deve ser maior que 0.");
    if (itemPreco < 0) return alert("Preço unitário inválido.");

    setItensDraft((prev) => [
      ...prev,
      { descricao: itemDescricao.trim(), qtd: Number(itemQtd), precoUnit: Number(itemPreco) },
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
      const res = await api.post<Orcamento>("/orcamento", { veiculoId, itens: itensDraft });
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
    setItensDraft(
      o.itens.map((it) => ({ descricao: it.descricao, qtd: it.qtd, precoUnit: it.precoUnit }))
    );
  }

  async function handleUpdate() {
    if (!editingId) return;
    if (!veiculoId) return alert("Selecione um veículo.");
    if (itensDraft.length === 0) return alert("Adicione pelo menos 1 item.");

    try {
      await api.put(`/orcamento/${editingId}`, { veiculoId, itens: itensDraft });
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

  async function handlePdf(id: number) {
    try {
      const res = await api.get(`/orcamento/${id}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao gerar PDF.");
    }
  }

  // ✅ integra: gerar registro técnico a partir do orçamento (com prompts)
  function todayYYYYMMDD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function buildDescricaoFromOrcamento(o: Orcamento) {
    const linhas = o.itens.map((it) => {
      return `- ${it.descricao} (${it.qtd}x R$ ${Number(it.precoUnit).toFixed(2)}) = R$ ${Number(it.valorLinha).toFixed(2)}`;
    });
    return `Registro gerado do Orçamento #${o.numero}\n` + linhas.join("\n");
  }

  async function gerarRegistroDoOrcamento(o: Orcamento) {
    try {
      const defaultCategoria = "Manutenção";
      const defaultData = todayYYYYMMDD();
      const defaultDescricao = buildDescricaoFromOrcamento(o);

      const categoria = prompt("Categoria do Registro Técnico:", defaultCategoria) ?? "";
      if (!categoria.trim()) return;

      const dataServico = prompt("Data do serviço (YYYY-MM-DD):", defaultData) ?? "";
      if (!dataServico.trim()) return;

      const descricao = prompt("Descrição (pode ajustar):", defaultDescricao) ?? "";
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
      alert(error?.response?.data?.message ?? "Erro ao gerar registro técnico a partir do orçamento.");
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  if (loading) return <div className="card">Carregando...</div>;

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="h2">Orçamentos</h2>
          <div className="sub">Crie, edite, gere PDF e transforme em Registro Técnico.</div>
        </div>
        <span className="badge">{orcamentos.length} orçamento(s)</span>
      </div>

      {/* FORM */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>{isEditing ? `Editando Orçamento #${editingId}` : "Novo Orçamento"}</h3>
          {isEditing && (
            <button onClick={resetForm} className="btn btnGray" type="button">
              Cancelar edição
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <span className="badge">Veículo</span>

          <select className="select" value={veiculoId} onChange={(e) => setVeiculoId(Number(e.target.value))} style={{ minWidth: 360 }}>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.modelo} ({v.placa}) — {v.cliente?.nome ?? "Sem cliente"}
              </option>
            ))}
          </select>

          <span className="badge">Subtotal: R$ {subtotalDraft.toFixed(2)}</span>
        </div>

        {/* Add item */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Descrição do item"
            value={itemDescricao}
            onChange={(e) => setItemDescricao(e.target.value)}
            style={{ width: 360 }}
          />

          <input
            className="input"
            type="number"
            placeholder="Qtd"
            value={itemQtd}
            onChange={(e) => setItemQtd(Number(e.target.value))}
            style={{ width: 110 }}
            min={1}
          />

          <input
            className="input"
            type="number"
            placeholder="Preço unit."
            value={itemPreco}
            onChange={(e) => setItemPreco(Number(e.target.value))}
            style={{ width: 140 }}
            min={0}
            step="0.01"
          />

          <button onClick={addItem} className="btn btnPrimary" type="button">
            Adicionar item
          </button>
        </div>

        {/* Items table */}
        <table className="table" style={{ marginBottom: 12 }}>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Unit</th>
              <th>Total</th>
              <th style={{ width: 160 }}>Ações</th>
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
                  <td>{it.descricao}</td>
                  <td>{it.qtd}</td>
                  <td>R$ {Number(it.precoUnit).toFixed(2)}</td>
                  <td>R$ {(Number(it.qtd) * Number(it.precoUnit)).toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeItem(idx)} className="btn btnRed" type="button">
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="row">
          <div className="sub">Total estimado: <b>R$ {subtotalDraft.toFixed(2)}</b></div>

          {isEditing ? (
            <button onClick={handleUpdate} className="btn btnBlue" type="button">
              Salvar alterações
            </button>
          ) : (
            <button onClick={handleCreate} className="btn btnPrimary" type="button">
              Criar orçamento
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Veículo</th>
              <th>Total</th>
              <th>Data</th>
              <th style={{ width: 520 }}>Ações</th>
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
                  <td>{o.numero}</td>
                  <td>{o.veiculo?.cliente?.nome ?? "-"}</td>
                  <td>{o.veiculo ? `${o.veiculo.modelo} (${o.veiculo.placa})` : `Veículo #${o.veiculoId}`}</td>
                  <td>R$ {Number(o.total).toFixed(2)}</td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => startEdit(o)} className="btn btnBlue" type="button">
                        Editar
                      </button>

                      <button onClick={() => handlePdf(o.id)} className="btn btnPrimary" type="button">
                        PDF
                      </button>

                      {/* Verde: como você não tem classe no CSS, usei inline mínimo só aqui.
                          Se quiser, eu te passo a classe .btnGreen no global.css. */}
                      <button
                        onClick={() => gerarRegistroDoOrcamento(o)}
                        type="button"
                        className="btn"
                        style={{ background: "#16a34a", borderColor: "#16a34a", color: "#fff" }}
                      >
                        Gerar Registro
                      </button>

                      <button onClick={() => handleDelete(o.id)} className="btn btnRed" type="button">
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
    </div>
  );
}