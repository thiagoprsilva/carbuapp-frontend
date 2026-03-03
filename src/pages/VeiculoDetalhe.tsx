import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  clienteId: number;
  cliente?: Cliente;
};

type RegistroTecnico = {
  id: number;
  categoria: string;
  descricao: string;
  dataServico: string;
  observacoes?: string | null;
  createdAt: string;
  veiculoId: number;
  orcamentoId?: number | null;
  orcamento?: { id: number; numero: number } | null;
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
  itens: OrcamentoItem[];
};

type OrcamentoItemDraft = {
  descricao: string;
  qtd: number;
  precoUnit: number;
};

export default function VeiculoDetalhe() {
  const { id } = useParams();
  const veiculoId = Number(id);

  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [registros, setRegistros] = useState<RegistroTecnico[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  // ===== UI: criar Registro Técnico inline =====
  const [showCreateRegistro, setShowCreateRegistro] = useState(false);
  const [creatingRegistro, setCreatingRegistro] = useState(false);

  const categoriasPadrao = ["Revisão", "Personalização", "Projeto"];
  const [categoria, setCategoria] = useState(categoriasPadrao[0]);
  const [descricao, setDescricao] = useState("");
  const [dataServico, setDataServico] = useState(() => {
    // padrão: hoje (YYYY-MM-DD) pro input date
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [observacoes, setObservacoes] = useState("");

  function resetRegistroForm() {
    setCategoria(categoriasPadrao[0]);
    setDescricao("");
    // mantém dataServico como está (pode ser útil)
    setObservacoes("");
  }

  // ===== UI: criar Orçamento inline =====
  const [showCreateOrcamento, setShowCreateOrcamento] = useState(false);
  const [creatingOrcamento, setCreatingOrcamento] = useState(false);

  const [itens, setItens] = useState<OrcamentoItemDraft[]>([
    { descricao: "", qtd: 1, precoUnit: 0 },
  ]);

  function resetOrcamentoForm() {
    setItens([{ descricao: "", qtd: 1, precoUnit: 0 }]);
  }

  const totalPreview = useMemo(() => {
    return itens.reduce((acc, it) => acc + (Number(it.qtd) || 0) * (Number(it.precoUnit) || 0), 0);
  }, [itens]);

  async function load() {
    setLoading(true);
    try {
      // GET /veiculos/:id
      // GET /registroTecnico?veiculoId=...
      // GET /orcamento?veiculoId=...
      const [vRes, rRes, oRes] = await Promise.all([
        api.get<Veiculo>(`/veiculos/${veiculoId}`),
        api.get<RegistroTecnico[]>(`/registroTecnico`, { params: { veiculoId } }),
        api.get<Orcamento[]>(`/orcamento`, { params: { veiculoId } }),
      ]);

      setVeiculo(vRes.data);
      setRegistros(rRes.data);
      setOrcamentos(oRes.data);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao carregar veículo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!veiculoId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veiculoId]);

  async function handlePdf(orcamentoId: number) {
    try {
      const res = await api.get(`/orcamento/${orcamentoId}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao gerar PDF.");
    }
  }

  function formatPtBr(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  // ===== CREATE: Registro Técnico =====
  async function handleCreateRegistro(e: React.FormEvent) {
    e.preventDefault();

    if (!categoria.trim()) {
      alert("Selecione a categoria.");
      return;
    }
    if (!descricao.trim()) {
      alert("Descrição é obrigatória.");
      return;
    }
    if (!dataServico) {
      alert("Data do serviço é obrigatória.");
      return;
    }

    setCreatingRegistro(true);
    try {
      // input date "YYYY-MM-DD" -> ISO (00:00)
      const dataIso = new Date(`${dataServico}T00:00:00`).toISOString();

      await api.post("/registroTecnico", {
        veiculoId,
        categoria: categoria.trim(),
        descricao: descricao.trim(),
        dataServico: dataIso,
        observacoes: observacoes.trim() || null,
      });

      resetRegistroForm();
      setShowCreateRegistro(false);
      await load();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao criar registro técnico.");
    } finally {
      setCreatingRegistro(false);
    }
  }

  // ===== CREATE: Orçamento =====
  function updateItem(index: number, patch: Partial<OrcamentoItemDraft>) {
    setItens((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItens((prev) => [...prev, { descricao: "", qtd: 1, precoUnit: 0 }]);
  }

  function removeItem(index: number) {
    setItens((prev) => {
      if (prev.length === 1) return prev; // mantém 1 linha
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleCreateOrcamento(e: React.FormEvent) {
    e.preventDefault();

    // valida itens
    const itensValidos = itens
      .map((it) => ({
        descricao: (it.descricao ?? "").trim(),
        qtd: Number(it.qtd) || 0,
        precoUnit: Number(it.precoUnit) || 0,
      }))
      .filter((it) => it.descricao.length > 0);

    if (itensValidos.length === 0) {
      alert("Adicione pelo menos 1 item com descrição.");
      return;
    }

    // garante qtd >= 1
    for (const it of itensValidos) {
      if (it.qtd < 1) {
        alert("Qtd deve ser pelo menos 1.");
        return;
      }
      if (it.precoUnit < 0) {
        alert("Preço unitário não pode ser negativo.");
        return;
      }
    }

    setCreatingOrcamento(true);
    try {
      await api.post("/orcamento", {
        veiculoId,
        itens: itensValidos,
      });

      resetOrcamentoForm();
      setShowCreateOrcamento(false);
      await load();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao criar orçamento.");
    } finally {
      setCreatingOrcamento(false);
    }
  }

  if (loading) return <div>Carregando...</div>;
  if (!veiculo) return <div>Veículo não encontrado.</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Detalhe do Veículo</h2>
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            {veiculo.modelo} ({veiculo.placa})
          </div>
          <div style={{ opacity: 0.85 }}>
            Cliente:{" "}
            <Link to={`/clientes/${veiculo.clienteId}`} style={{ color: "#2563eb", textDecoration: "none" }}>
              {veiculo.cliente?.nome ?? `Cliente #${veiculo.clienteId}`}
            </Link>
          </div>
          <div style={{ opacity: 0.8 }}>
            Ano: {veiculo.ano ?? "-"} | Motor: {veiculo.motor ?? "-"} | Alimentação: {veiculo.alimentacao ?? "-"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowCreateRegistro((v) => !v)}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #2563eb",
              color: "#fff",
              background: "#2563eb",
              cursor: "pointer",
            }}
          >
            {showCreateRegistro ? "Fechar Registro" : "Novo Registro"}
          </button>

          <button
            onClick={() => setShowCreateOrcamento((v) => !v)}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #111827",
              color: "#fff",
              background: "#111827",
              cursor: "pointer",
            }}
          >
            {showCreateOrcamento ? "Fechar Orçamento" : "Novo Orçamento"}
          </button>

          <Link
            to="/veiculos"
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #ddd",
              textDecoration: "none",
              color: "#111827",
              background: "#fff",
            }}
          >
            Voltar
          </Link>
        </div>
      </div>

      {/* FORM: NOVO REGISTRO TÉCNICO */}
      {showCreateRegistro && (
        <div style={{ marginTop: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Cadastrar Registro Técnico</h3>

          <form onSubmit={handleCreateRegistro} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", minWidth: 220 }}
            >
              {categoriasPadrao.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              placeholder="Descrição do serviço (obrigatório)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 360 }}
            />

            <input
              type="date"
              value={dataServico}
              onChange={(e) => setDataServico(e.target.value)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 160 }}
            />

            <input
              placeholder="Observações (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 320 }}
            />

            <button
              type="submit"
              disabled={creatingRegistro}
              style={{
                padding: "10px 16px",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {creatingRegistro ? "Salvando..." : "Salvar Registro"}
            </button>
          </form>
        </div>
      )}

      {/* FORM: NOVO ORÇAMENTO */}
      {showCreateOrcamento && (
        <div style={{ marginTop: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Criar Orçamento</h3>

          <form onSubmit={handleCreateOrcamento}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {itens.map((it, idx) => (
                <div key={idx} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    placeholder="Descrição do item"
                    value={it.descricao}
                    onChange={(e) => updateItem(idx, { descricao: e.target.value })}
                    style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 420 }}
                  />

                  <input
                    type="number"
                    min={1}
                    placeholder="Qtd"
                    value={it.qtd}
                    onChange={(e) => updateItem(idx, { qtd: Number(e.target.value) })}
                    style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 120 }}
                  />

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Preço Unit"
                    value={it.precoUnit}
                    onChange={(e) => updateItem(idx, { precoUnit: Number(e.target.value) })}
                    style={{ padding: 10, border: "1px solid #ccc", borderRadius: 4, background: "#fff", width: 140 }}
                  />

                  <div style={{ minWidth: 140, fontWeight: 800 }}>
                    R$ {(Number(it.qtd) * Number(it.precoUnit)).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    style={{
                      padding: "10px 12px",
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Remover
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
                <button
                  type="button"
                  onClick={addItem}
                  style={{
                    padding: "10px 12px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  + Adicionar item
                </button>

                <div style={{ marginLeft: "auto", fontWeight: 900, fontSize: 16 }}>
                  Total: R$ {totalPreview.toFixed(2)}
                </div>

                <button
                  type="submit"
                  disabled={creatingOrcamento}
                  style={{
                    padding: "10px 16px",
                    background: "#111827",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  {creatingOrcamento ? "Salvando..." : "Salvar Orçamento"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* REGISTROS */}
      <div style={{ marginTop: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Histórico Técnico</h3>

        {registros.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nenhum registro técnico encontrado.</div>
        ) : (
          <table style={{ width: "100%", border: "1px solid #eee" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Data</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Categoria</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Descrição</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Orçamento</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{formatPtBr(r.dataServico)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{r.categoria}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{r.descricao}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{r.orcamento ? `#${r.orcamento.numero}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ORÇAMENTOS */}
      <div style={{ marginTop: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Orçamentos</h3>

        {orcamentos.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nenhum orçamento encontrado.</div>
        ) : (
          <table style={{ width: "100%", border: "1px solid #eee" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Número</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Data</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Total</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((o) => (
                <tr key={o.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>#{o.numero}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{formatPtBr(o.createdAt)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>R$ {Number(o.total).toFixed(2)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    <button
                      onClick={() => handlePdf(o.id)}
                      style={{
                        padding: "8px 12px",
                        background: "#111827",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}