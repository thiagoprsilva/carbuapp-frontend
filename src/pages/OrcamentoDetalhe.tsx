import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import ChecklistAvarias, { AvariaMap } from "../components/ChecklistAvarias";
import FotoUpload from "../components/FotoUpload";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type OrcamentoItem = {
  id: number;
  descricao: string;
  qtd: number;
  precoUnit: number;
  valorLinha: number;
};

type Orcamento = {
  id: number;
  numero: number;
  status: string;
  total: number;
  subtotal: number;
  createdAt: string;
  veiculoId: number;
  veiculo?: {
    id: number;
    modelo: string;
    placa: string;
    cliente?: { id: number; nome: string; telefone?: string | null } | null;
  };
  itens: OrcamentoItem[];
};

type LaudoData = {
  id: number;
  km?: number | null;
  nivelCombust?: string | null;
  observacoes?: string | null;
  avarias: { zona: string; severidade: string; observacao?: string | null }[];
} | null;

const NIVEIS_COMBUST = ["1/4", "1/2", "3/4", "cheio"];

const STATUS_COR: Record<string, string> = {
  Pendente:   "#f59e0b",
  Aprovado:   "#60a5fa",
  Executado:  "#4ade80",
  Rejeitado:  "#f87171",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function OrcamentoDetalhe() {
  const { id } = useParams();
  const orcamentoId = Number(id);

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"itens" | "laudo" | "fotos">("itens");

  // Laudo
  const [laudo, setLaudo] = useState<LaudoData>(null);
  const [loadingLaudo, setLoadingLaudo] = useState(false);
  const [avariasEdit, setAvariasEdit] = useState<AvariaMap>({});
  const [kmEdit, setKmEdit] = useState<string>("");
  const [nivelEdit, setNivelEdit] = useState<string>("");
  const [obsEdit, setObsEdit] = useState<string>("");
  const [savingLaudo, setSavingLaudo] = useState(false);
  const [laudoEditMode, setLaudoEditMode] = useState(false);

  // ─── Carga de dados ──────────────────────────────────────────────────────────

  async function loadOrcamento() {
    setLoading(true);
    try {
      // Busca da lista e filtra — o backend não tem GET /orcamento/:id ainda
      const res = await api.get<Orcamento[]>("/orcamento");
      const found = res.data.find((o) => o.id === orcamentoId);
      if (!found) throw new Error("Orçamento não encontrado.");
      setOrcamento(found);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao carregar orçamento.");
    } finally {
      setLoading(false);
    }
  }

  async function loadLaudo() {
    setLoadingLaudo(true);
    try {
      const res = await api.get<NonNullable<LaudoData>>(`/orcamento/${orcamentoId}/laudo`);
      setLaudo(res.data);
      populateLaudoEdit(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setLaudo(null);
        setAvariasEdit({});
        setKmEdit("");
        setNivelEdit("");
        setObsEdit("");
      } else {
        toast.error("Erro ao carregar laudo.");
      }
    } finally {
      setLoadingLaudo(false);
    }
  }

  function populateLaudoEdit(data: NonNullable<LaudoData>) {
    setKmEdit(data.km?.toString() ?? "");
    setNivelEdit(data.nivelCombust ?? "");
    setObsEdit(data.observacoes ?? "");
    const map: AvariaMap = {};
    for (const a of data.avarias) {
      map[a.zona as any] = {
        zona: a.zona as any,
        severidade: a.severidade as any,
        observacao: a.observacao ?? undefined,
      };
    }
    setAvariasEdit(map);
  }

  useEffect(() => {
    if (!orcamentoId) return;
    loadOrcamento();
  }, [orcamentoId]);

  useEffect(() => {
    if (activeTab === "laudo" && orcamentoId) {
      loadLaudo();
    }
  }, [activeTab, orcamentoId]);

  // ─── Salvar laudo ────────────────────────────────────────────────────────────

  async function handleSalvarLaudo(e: React.FormEvent) {
    e.preventDefault();
    setSavingLaudo(true);
    try {
      const avariasArr = Object.values(avariasEdit).map((a) => ({
        zona: a.zona,
        severidade: a.severidade,
        observacao: a.observacao ?? undefined,
      }));

      await api.post(`/orcamento/${orcamentoId}/laudo`, {
        km: kmEdit ? Number(kmEdit) : undefined,
        nivelCombust: nivelEdit || undefined,
        observacoes: obsEdit.trim() || undefined,
        avarias: avariasArr,
      });

      toast.success("Laudo salvo!");
      setLaudoEditMode(false);
      await loadLaudo();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao salvar laudo.");
    } finally {
      setSavingLaudo(false);
    }
  }

  // ─── PDF ─────────────────────────────────────────────────────────────────────

  async function handlePdf() {
    const toastId = toast.loading("Gerando PDF...");
    try {
      const res = await api.get(`/orcamento/${orcamentoId}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      toast.success("PDF aberto!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao gerar PDF.", { id: toastId });
    }
  }

  // ─── WhatsApp ────────────────────────────────────────────────────────────────

  function handleWhatsApp() {
    if (!orcamento) return;
    const telefone = orcamento.veiculo?.cliente?.telefone;
    if (!telefone) { toast.error("Cliente sem telefone cadastrado."); return; }
    const numero = telefone.replace(/\D/g, "");
    const phone = numero.startsWith("55") ? numero : `55${numero}`;
    const veiculo = orcamento.veiculo ? `${orcamento.veiculo.modelo} (${orcamento.veiculo.placa})` : "veículo";
    const itensTexto = orcamento.itens
      .map((it) => `• ${it.descricao} (${it.qtd}x) — R$ ${Number(it.valorLinha).toFixed(2)}`)
      .join("\n");
    const mensagem =
      `Olá! Segue o orçamento *#${orcamento.numero}* para o ${veiculo}:\n\n` +
      `${itensTexto}\n\n` +
      `*Total: R$ ${Number(orcamento.total).toFixed(2)}*\n\n` +
      `Aguardamos seu retorno!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) return <div className="card">Carregando...</div>;
  if (!orcamento) return <div className="card">Orçamento não encontrado.</div>;

  const corStatus = STATUS_COR[orcamento.status] ?? "#8b8d9e";

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="h2">Orçamento #{orcamento.numero}</h2>
          <div className="sub">
            {orcamento.veiculo ? (
              <>
                <Link to={`/veiculos/${orcamento.veiculo.id}`} style={{ fontWeight: 900, textDecoration: "none" }}>
                  {orcamento.veiculo.modelo} ({orcamento.veiculo.placa})
                </Link>
                {orcamento.veiculo.cliente && (
                  <> · {orcamento.veiculo.cliente.nome}</>
                )}
              </>
            ) : `Veículo #${orcamento.veiculoId}`}
          </div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="badge" style={{ color: corStatus, borderColor: corStatus, background: `${corStatus}18` }}>
              {orcamento.status}
            </span>
            <span style={{ fontWeight: 900, fontSize: 18 }}>
              R$ {Number(orcamento.total).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="page-header-actions">
          <button
            className="btn"
            style={{ background: "#25D366", borderColor: "#25D366", color: "#fff" }}
            onClick={handleWhatsApp}
            type="button"
          >
            WhatsApp
          </button>
          <button className="btn btnPrimary" onClick={handlePdf} type="button">
            PDF
          </button>
          <Link to="/orcamentos" className="btn">Voltar</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "itens" ? "active" : ""}`}
          onClick={() => setActiveTab("itens")}
          type="button"
        >
          Itens <span className="badge" style={{ marginLeft: 6 }}>{orcamento.itens.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "laudo" ? "active" : ""}`}
          onClick={() => setActiveTab("laudo")}
          type="button"
        >
          Laudo de Entrada
        </button>
        <button
          className={`tab-btn ${activeTab === "fotos" ? "active" : ""}`}
          onClick={() => setActiveTab("fotos")}
          type="button"
        >
          Fotos
        </button>
      </div>

      {/* ABA: ITENS */}
      {activeTab === "itens" && (
        <div className="card">
          <div className="table-scroll">
            <table className="table table-min-md table-cards">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orcamento.itens.map((it) => (
                  <tr key={it.id}>
                    <td data-label="Descrição">{it.descricao}</td>
                    <td data-label="Qtd">{it.qtd}</td>
                    <td data-label="Unit.">R$ {Number(it.precoUnit).toFixed(2)}</td>
                    <td data-label="Total" style={{ fontWeight: 900 }}>R$ {Number(it.valorLinha).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", fontWeight: 700, paddingRight: 12 }}>Total</td>
                  <td style={{ fontWeight: 900, fontSize: 16 }}>R$ {Number(orcamento.total).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ABA: LAUDO */}
      {activeTab === "laudo" && (
        <div className="card">
          {loadingLaudo ? (
            <div className="sub">Carregando laudo...</div>
          ) : (
            <>
              {/* Barra de ação do laudo */}
              <div className="page-header" style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>Laudo de Entrada</h3>
                <div className="page-header-actions">
                  {!laudoEditMode ? (
                    <button className="btn btnBlue" type="button" onClick={() => { setLaudoEditMode(true); if (!laudo) { setAvariasEdit({}); setKmEdit(""); setNivelEdit(""); setObsEdit(""); } }}>
                      {laudo ? "Editar laudo" : "Registrar entrada"}
                    </button>
                  ) : (
                    <button className="btn btnGray" type="button" onClick={() => { setLaudoEditMode(false); if (laudo) populateLaudoEdit(laudo); }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>

              {laudoEditMode ? (
                /* FORMULÁRIO DE EDIÇÃO */
                <form onSubmit={handleSalvarLaudo}>
                  <div className="inline-form" style={{ marginBottom: 16 }}>
                    <div className="field-wrap field-medium">
                      <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>KM atual</label>
                      <input className="input" type="number" placeholder="Ex: 45000" value={kmEdit} onChange={(e) => setKmEdit(e.target.value)} />
                    </div>
                    <div className="field-wrap field-medium">
                      <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Nível de combustível</label>
                      <select className="select" value={nivelEdit} onChange={(e) => setNivelEdit(e.target.value)}>
                        <option value="">Selecione</option>
                        {NIVEIS_COMBUST.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="field-wrap field-wide">
                      <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Observações gerais</label>
                      <input className="input" placeholder="Observações (opcional)" value={obsEdit} onChange={(e) => setObsEdit(e.target.value)} />
                    </div>
                  </div>

                  <ChecklistAvarias avarias={avariasEdit} onChange={setAvariasEdit} />

                  <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                    <button type="submit" className="btn btnPrimary" disabled={savingLaudo}>
                      {savingLaudo ? "Salvando..." : "Salvar laudo"}
                    </button>
                  </div>
                </form>
              ) : laudo ? (
                /* VISUALIZAÇÃO DO LAUDO */
                <div>
                  <div className="detail-grid" style={{ marginBottom: 16 }}>
                    {laudo.km && (
                      <div className="detail-span-4">
                        <div className="sub" style={{ fontSize: 11 }}>KM</div>
                        <div style={{ fontWeight: 700 }}>{laudo.km.toLocaleString("pt-BR")} km</div>
                      </div>
                    )}
                    {laudo.nivelCombust && (
                      <div className="detail-span-4">
                        <div className="sub" style={{ fontSize: 11 }}>Combustível</div>
                        <div style={{ fontWeight: 700 }}>{laudo.nivelCombust}</div>
                      </div>
                    )}
                    {laudo.observacoes && (
                      <div className="detail-span-4">
                        <div className="sub" style={{ fontSize: 11 }}>Observações</div>
                        <div>{laudo.observacoes}</div>
                      </div>
                    )}
                  </div>
                  <ChecklistAvarias avarias={
                    Object.fromEntries(
                      laudo.avarias.map((a) => [a.zona, { zona: a.zona as any, severidade: a.severidade as any, observacao: a.observacao ?? undefined }])
                    )
                  } readonly />
                </div>
              ) : (
                <div className="sub" style={{ padding: "12px 0" }}>
                  Nenhum laudo de entrada registrado. Clique em "Registrar entrada" para criar.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ABA: FOTOS */}
      {activeTab === "fotos" && (
        <div className="card">
          <div className="page-header" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Fotos do Veículo</h3>
          </div>
          <FotoUpload orcamentoId={orcamentoId} />
        </div>
      )}
    </div>
  );
}
