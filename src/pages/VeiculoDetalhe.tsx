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
    setObservacoes("");
  }

  // ===== UI: criar Orçamento inline =====
  const [showCreateOrcamento, setShowCreateOrcamento] = useState(false);
  const [creatingOrcamento, setCreatingOrcamento] = useState(false);

  const [itens, setItens] = useState<OrcamentoItemDraft[]>([{ descricao: "", qtd: 1, precoUnit: 0 }]);

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

    if (!categoria.trim()) return alert("Selecione a categoria.");
    if (!descricao.trim()) return alert("Descrição é obrigatória.");
    if (!dataServico) return alert("Data do serviço é obrigatória.");

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

    if (itensValidos.length === 0) return alert("Adicione pelo menos 1 item com descrição.");

    for (const it of itensValidos) {
      if (it.qtd < 1) return alert("Qtd deve ser pelo menos 1.");
      if (it.precoUnit < 0) return alert("Preço unitário não pode ser negativo.");
    }

    setCreatingOrcamento(true);
    try {
      await api.post("/orcamento", { veiculoId, itens: itensValidos });

      resetOrcamentoForm();
      setShowCreateOrcamento(false);
      await load();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao criar orçamento.");
    } finally {
      setCreatingOrcamento(false);
    }
  }

  if (loading) return <div className="card">Carregando...</div>;
  if (!veiculo) return <div className="card">Veículo não encontrado.</div>;

  return (
    <div>
      {/* HEADER */}
      <div className="row" style={{ marginBottom: 14 }}>
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

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="btn btnBlue" onClick={() => setShowCreateRegistro((v) => !v)}>
            {showCreateRegistro ? "Fechar Registro" : "Novo Registro"}
          </button>

          <button className="btn btnPrimary" onClick={() => setShowCreateOrcamento((v) => !v)}>
            {showCreateOrcamento ? "Fechar Orçamento" : "Novo Orçamento"}
          </button>

          <Link to="/veiculos" className="btn">
            Voltar
          </Link>
        </div>
      </div>

      {/* FORM: NOVO REGISTRO */}
      {showCreateRegistro && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Cadastrar Registro Técnico</h3>
            <span className="badge">Veículo #{veiculoId}</span>
          </div>

          <form onSubmit={handleCreateRegistro} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ minWidth: 220 }}>
              {categoriasPadrao.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              className="input"
              placeholder="Descrição do serviço (obrigatório)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={{ width: 360 }}
            />

            <input className="input" type="date" value={dataServico} onChange={(e) => setDataServico(e.target.value)} style={{ width: 160 }} />

            <input
              className="input"
              placeholder="Observações (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              style={{ width: 320 }}
            />

            <button type="submit" disabled={creatingRegistro} className="btn btnPrimary">
              {creatingRegistro ? "Salvando..." : "Salvar Registro"}
            </button>
          </form>
        </div>
      )}

      {/* FORM: NOVO ORÇAMENTO */}
      {showCreateOrcamento && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Criar Orçamento</h3>
            <span className="badge">Prévia: R$ {totalPreview.toFixed(2)}</span>
          </div>

          <form onSubmit={handleCreateOrcamento} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {itens.map((it, idx) => (
              <div key={idx} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  className="input"
                  placeholder="Descrição do item"
                  value={it.descricao}
                  onChange={(e) => updateItem(idx, { descricao: e.target.value })}
                  style={{ width: 420 }}
                />

                <input
                  className="input"
                  type="number"
                  min={1}
                  placeholder="Qtd"
                  value={it.qtd}
                  onChange={(e) => updateItem(idx, { qtd: Number(e.target.value) })}
                  style={{ width: 120 }}
                />

                <input
                  className="input"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Preço Unit"
                  value={it.precoUnit}
                  onChange={(e) => updateItem(idx, { precoUnit: Number(e.target.value) })}
                  style={{ width: 140 }}
                />

                <span className="badge">R$ {(Number(it.qtd) * Number(it.precoUnit)).toFixed(2)}</span>

                <button type="button" onClick={() => removeItem(idx)} className="btn btnRed">
                  Remover
                </button>
              </div>
            ))}

            <div className="row" style={{ justifyContent: "flex-start", gap: 10 }}>
              <button type="button" onClick={addItem} className="btn btnBlue">
                + Adicionar item
              </button>

              <div style={{ marginLeft: "auto" }}>
                <button type="submit" disabled={creatingOrcamento} className="btn btnPrimary">
                  {creatingOrcamento ? "Salvando..." : "Salvar Orçamento"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* REGISTROS */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Histórico Técnico</h3>
          <span className="badge">{registros.length} registro(s)</span>
        </div>

        {registros.length === 0 ? (
          <div className="sub">Nenhum registro técnico encontrado.</div>
        ) : (
          <table className="table">
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
                  <td>{formatPtBr(r.dataServico)}</td>
                  <td>{r.categoria}</td>
                  <td>{r.descricao}</td>
                  <td>{r.orcamento ? `#${r.orcamento.numero}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ORÇAMENTOS */}
      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Orçamentos</h3>
          <span className="badge">{orcamentos.length} orçamento(s)</span>
        </div>

        {orcamentos.length === 0 ? (
          <div className="sub">Nenhum orçamento encontrado.</div>
        ) : (
          <table className="table">
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
                  <td>#{o.numero}</td>
                  <td>{formatPtBr(o.createdAt)}</td>
                  <td>R$ {Number(o.total).toFixed(2)}</td>
                  <td>
                    <button className="btn btnPrimary" onClick={() => handlePdf(o.id)}>
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