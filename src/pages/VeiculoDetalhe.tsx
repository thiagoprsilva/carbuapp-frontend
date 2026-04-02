import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
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
  const [showCreateRegistro, setShowCreateRegistro] = useState(false);
  const [creatingRegistro, setCreatingRegistro] = useState(false);
  const categoriasPadrao = ["Revisão", "Personalização", "Projeto"];
  const [categoria, setCategoria] = useState(categoriasPadrao[0]);
  const [descricao, setDescricao] = useState("");
  const [dataServico, setDataServico] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [observacoes, setObservacoes] = useState("");
  const [showCreateOrcamento, setShowCreateOrcamento] = useState(false);
  const [creatingOrcamento, setCreatingOrcamento] = useState(false);
  const [itens, setItens] = useState<OrcamentoItemDraft[]>([{ descricao: "", qtd: 1, precoUnit: 0 }]);

  function resetRegistroForm() {
    setCategoria(categoriasPadrao[0]);
    setDescricao("");
    setObservacoes("");
  }

  function resetOrcamentoForm() {
    setItens([{ descricao: "", qtd: 1, precoUnit: 0 }]);
  }

  const totalPreview = useMemo(() => {
    return itens.reduce((acc, it) => acc + (Number(it.qtd) || 0) * (Number(it.precoUnit) || 0), 0);
  }, [itens]);

  async function load() {
    setLoading(true);
    try {
      const [vRes, rRes, oRes] = await Promise.all([
        api.get<Veiculo>(`/veiculos/${veiculoId}`),
        api.get<RegistroTecnico[]>("/registroTecnico", { params: { veiculoId } }),
        api.get<Orcamento[]>("/orcamento", { params: { veiculoId } }),
      ]);

      setVeiculo(vRes.data);
      setRegistros(rRes.data);
      setOrcamentos(oRes.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao carregar veículo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!veiculoId) return;
    load();
  }, [veiculoId]);

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

  async function handleCreateRegistro(e: React.FormEvent) {
    e.preventDefault();

    if (!categoria.trim()) { toast.error("Selecione a categoria."); return; }
    if (!descricao.trim()) { toast.error("Descrição é obrigatória."); return; }
    if (!dataServico) { toast.error("Data do serviço é obrigatória."); return; }

    setCreatingRegistro(true);
    try {
      const dataIso = new Date(`${dataServico}T00:00:00`).toISOString();

      await api.post("/registroTecnico", {
        veiculoId,
        categoria: categoria.trim(),
        descricao: descricao.trim(),
        dataServico: dataIso,
        observacoes: observacoes.trim() || null,
      });

      toast.success("Registro técnico criado!");
      resetRegistroForm();
      setShowCreateRegistro(false);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao criar registro técnico.");
    } finally {
      setCreatingRegistro(false);
    }
  }

  function updateItem(index: number, patch: Partial<OrcamentoItemDraft>) {
    setItens((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItens((prev) => [...prev, { descricao: "", qtd: 1, precoUnit: 0 }]);
  }

  function removeItem(index: number) {
    setItens((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleCreateOrcamento(e: React.FormEvent) {
    e.preventDefault();

    const itensValidos = itens
      .map((it) => ({
        descricao: (it.descricao ?? "").trim(),
        qtd: Number(it.qtd) || 0,
        precoUnit: Number(it.precoUnit) || 0,
      }))
      .filter((it) => it.descricao.length > 0);

    if (itensValidos.length === 0) { toast.error("Adicione pelo menos 1 item com descrição."); return; }

    for (const it of itensValidos) {
      if (it.qtd < 1) { toast.error("Qtd deve ser pelo menos 1."); return; }
      if (it.precoUnit < 0) { toast.error("Preço unitário não pode ser negativo."); return; }
    }

    setCreatingOrcamento(true);
    try {
      await api.post("/orcamento", { veiculoId, itens: itensValidos });

      toast.success("Orçamento criado!");
      resetOrcamentoForm();
      setShowCreateOrcamento(false);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao criar orçamento.");
    } finally {
      setCreatingOrcamento(false);
    }
  }

  if (loading) return <div className="card">Carregando...</div>;
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
          <button className="btn btnBlue" onClick={() => setShowCreateRegistro((v) => !v)} type="button">
            {showCreateRegistro ? "Fechar Registro" : "Novo Registro"}
          </button>

          <button className="btn btnPrimary" onClick={() => setShowCreateOrcamento((v) => !v)} type="button">
            {showCreateOrcamento ? "Fechar Orçamento" : "Novo Orçamento"}
          </button>

          <Link to="/veiculos" className="btn">
            Voltar
          </Link>
        </div>
      </div>

      {showCreateRegistro && (
        <div className="card card-section">
          <div className="page-header" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Cadastrar Registro Técnico</h3>
            <span className="badge">Veículo #{veiculoId}</span>
          </div>

          <form onSubmit={handleCreateRegistro} className="inline-form">
            <div className="field-medium">
              <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {categoriasPadrao.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-wide">
              <input
                className="input"
                placeholder="Descrição do serviço (obrigatório)"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="field-medium">
              <input className="input" type="date" value={dataServico} onChange={(e) => setDataServico(e.target.value)} />
            </div>

            <div className="field-wide">
              <input
                className="input"
                placeholder="Observações (opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <button type="submit" disabled={creatingRegistro} className="btn btnPrimary">
              {creatingRegistro ? "Salvando..." : "Salvar Registro"}
            </button>
          </form>
        </div>
      )}

      {showCreateOrcamento && (
        <div className="card card-section">
          <div className="page-header" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Criar Orçamento</h3>
            <span className="badge">Prévia: R$ {totalPreview.toFixed(2)}</span>
          </div>

          <form onSubmit={handleCreateOrcamento} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {itens.map((it, idx) => (
              <div key={idx} className="card" style={{ padding: 12 }}>
                <div className="item-row">
                  <input
                    className="input"
                    placeholder="Descrição do item"
                    value={it.descricao}
                    onChange={(e) => updateItem(idx, { descricao: e.target.value })}
                  />

                  <input
                    className="input"
                    type="number"
                    min={1}
                    placeholder="Qtd"
                    value={it.qtd}
                    onChange={(e) => updateItem(idx, { qtd: Number(e.target.value) })}
                  />

                  <input
                    className="input"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Preço Unit"
                    value={it.precoUnit}
                    onChange={(e) => updateItem(idx, { precoUnit: Number(e.target.value) })}
                  />

                  <span className="badge">R$ {(Number(it.qtd) * Number(it.precoUnit)).toFixed(2)}</span>

                  <button type="button" onClick={() => removeItem(idx)} className="btn btnRed">
                    Remover
                  </button>
                </div>
              </div>
            ))}

            <div className="summary-line">
              <button type="button" onClick={addItem} className="btn btnBlue">
                + Adicionar item
              </button>

              <button type="submit" disabled={creatingOrcamento} className="btn btnPrimary">
                {creatingOrcamento ? "Salvando..." : "Salvar Orçamento"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card card-section">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Histórico Técnico</h3>
          <span className="badge">{registros.length} registro(s)</span>
        </div>

        {registros.length === 0 ? (
          <div className="sub">Nenhum registro técnico encontrado.</div>
        ) : (
          <div className="table-scroll">
            <table className="table table-min-md table-cards">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Categoria</th>
                  <th>Descrição</th>
                  <th>Orçamento</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Data">{formatPtBr(r.dataServico)}</td>
                    <td data-label="Categoria">{r.categoria}</td>
                    <td data-label="Descrição">{r.descricao}</td>
                    <td data-label="Orçamento">{r.orcamento ? `#${r.orcamento.numero}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Orçamentos</h3>
          <span className="badge">{orcamentos.length} orçamento(s)</span>
        </div>

        {orcamentos.length === 0 ? (
          <div className="sub">Nenhum orçamento encontrado.</div>
        ) : (
          <div className="table-scroll">
            <table className="table table-min-md table-cards">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th style={{ width: 160 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentos.map((o) => (
                  <tr key={o.id}>
                    <td data-label="Número">#{o.numero}</td>
                    <td data-label="Data">{formatPtBr(o.createdAt)}</td>
                    <td data-label="Total">R$ {Number(o.total).toFixed(2)}</td>
                    <td>
                      <div className="action-group">
                        <button className="btn btnPrimary" onClick={() => handlePdf(o.id)} type="button">
                          PDF
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
