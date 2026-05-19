import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import ChecklistAvarias, { AvariaMap } from "../components/ChecklistAvarias";
import FotoUpload from "../components/FotoUpload";
import { SkeletonCard } from "../components/Skeleton";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TemplateItem = { descricao: string; qtd: number; precoUnit: number };
type Template = { id: number; nome: string; itens: TemplateItem[] };

type OrcamentoItem = { id: number; descricao: string; qtd: number; precoUnit: number; valorLinha: number };

type Orcamento = {
  id: number;
  numero: number;
  status: string;
  total: number;
  createdAt: string;
  itens: OrcamentoItem[];
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
  veiculo?: {
    id: number;
    modelo: string;
    placa: string;
    cliente?: { id: number; nome: string; telefone?: string | null } | null;
  };
  laudo?: {
    id: number;
    km?: number | null;
    nivelCombust?: string | null;
    observacoes?: string | null;
    avarias: { zona: string; severidade: string; observacao?: string | null }[];
  } | null;
  fotos: { id: number; url: string; descricao?: string | null }[];
  orcamentos: Orcamento[];
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const NIVEIS_COMBUST = ["1/4", "1/2", "3/4", "cheio"];
const STATUS_OS = ["Aberta", "Em andamento", "Aguardando peças", "Concluída", "Cancelada"];
const STATUS_ORC = ["Pendente", "Aprovado", "Executado", "Rejeitado"];

const STATUS_COR: Record<string, string> = {
  Aberta:            "#60a5fa",
  "Em andamento":    "#f59e0b",
  "Aguardando peças":"#a78bfa",
  Concluída:         "#4ade80",
  Cancelada:         "#f87171",
};
const STATUS_ORC_COR: Record<string, string> = {
  Pendente:  "#f59e0b",
  Aprovado:  "#60a5fa",
  Executado: "#4ade80",
  Rejeitado: "#f87171",
};

function formatPtBr(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function OSDetalhe() {
  const { id } = useParams();
  const osId = Number(id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"orcamentos" | "laudo" | "fotos">("orcamentos");

  // ─── Laudo edit ─────────────────────────────────────────────────────────────
  const [laudoEditMode, setLaudoEditMode] = useState(false);
  const [avariasEdit, setAvariasEdit] = useState<AvariaMap>({});
  const [kmEdit, setKmEdit] = useState("");
  const [nivelEdit, setNivelEdit] = useState("");
  const [obsLaudoEdit, setObsLaudoEdit] = useState("");
  const [savingLaudo, setSavingLaudo] = useState(false);

  // ─── Novo orçamento form ────────────────────────────────────────────────────
  const [showOrcForm, setShowOrcForm] = useState(false);
  const [orcItens, setOrcItens] = useState([{ descricao: "", qtd: 1, precoUnit: 0 }]);
  const [savingOrc, setSavingOrc] = useState(false);

  // ─── Templates ──────────────────────────────────────────────────────────────
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: () => api.get<Template[]>("/templates").then((r) => r.data),
  });

  // ─── Status change ──────────────────────────────────────────────────────────
  const [changingStatus, setChangingStatus] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────

  const { data: os, isLoading: loading } = useQuery<OS>({
    queryKey: ["os", osId],
    queryFn: async () => {
      try {
        const res = await api.get<OS>(`/registroTecnico/${osId}`);
        return res.data;
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Erro ao carregar OS.");
        throw err;
      }
    },
    enabled: !!osId,
  });

  function populateLaudo(laudo: NonNullable<OS["laudo"]>) {
    setKmEdit(laudo.km?.toString() ?? "");
    setNivelEdit(laudo.nivelCombust ?? "");
    setObsLaudoEdit(laudo.observacoes ?? "");
    const map: AvariaMap = {};
    for (const a of laudo.avarias) {
      map[a.zona as any] = { zona: a.zona as any, severidade: a.severidade as any, observacao: a.observacao ?? undefined };
    }
    setAvariasEdit(map);
  }

  // ─── Status da OS ──────────────────────────────────────────────────────────

  async function handleChangeStatus(novoStatus: string) {
    if (!os || changingStatus) return;
    setChangingStatus(true);
    const anterior = os.status;
    queryClient.setQueryData<OS>(["os", osId], (prev) => prev ? { ...prev, status: novoStatus } : prev);
    try {
      await api.patch(`/registroTecnico/${osId}/status`, { status: novoStatus });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao atualizar status.");
      queryClient.setQueryData<OS>(["os", osId], (prev) => prev ? { ...prev, status: anterior } : prev);
    } finally {
      setChangingStatus(false);
    }
  }

  // ─── Laudo ─────────────────────────────────────────────────────────────────

  async function handleSalvarLaudo(e: React.FormEvent) {
    e.preventDefault();
    setSavingLaudo(true);
    try {
      const avariasArr = Object.values(avariasEdit).map((a) => ({
        zona: a.zona,
        severidade: a.severidade,
        observacao: a.observacao ?? undefined,
      }));
      await api.post(`/registroTecnico/${osId}/laudo`, {
        km: kmEdit ? Number(kmEdit) : undefined,
        nivelCombust: nivelEdit || undefined,
        observacoes: obsLaudoEdit.trim() || undefined,
        avarias: avariasArr,
      });
      toast.success("Laudo salvo!");
      setLaudoEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["os", osId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao salvar laudo.");
    } finally {
      setSavingLaudo(false);
    }
  }

  // ─── Novo orçamento ────────────────────────────────────────────────────────

  function addItem() {
    setOrcItens((prev) => [...prev, { descricao: "", qtd: 1, precoUnit: 0 }]);
  }

  function removeItem(idx: number) {
    setOrcItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setOrcItens((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const orcTotal = orcItens.reduce((acc, it) => acc + it.qtd * it.precoUnit, 0);

  async function handleCriarOrcamento(e: React.FormEvent) {
    e.preventDefault();
    if (orcItens.some((it) => !it.descricao.trim())) {
      toast.error("Preencha a descrição de todos os itens.");
      return;
    }
    setSavingOrc(true);
    try {
      await api.post("/orcamento", {
        registroTecnicoId: osId,
        itens: orcItens.map((it) => ({
          descricao: it.descricao.trim(),
          qtd: it.qtd,
          precoUnit: it.precoUnit,
        })),
      });
      toast.success("Orçamento criado!");
      setShowOrcForm(false);
      setOrcItens([{ descricao: "", qtd: 1, precoUnit: 0 }]);
      queryClient.invalidateQueries({ queryKey: ["os", osId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao criar orçamento.");
    } finally {
      setSavingOrc(false);
    }
  }

  // ─── PDF ───────────────────────────────────────────────────────────────────

  async function handlePdf(orcamentoId: number) {
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

  // ─── WhatsApp ──────────────────────────────────────────────────────────────

  function handleWhatsApp(orc: Orcamento) {
    if (!os) return;
    const telefone = os.veiculo?.cliente?.telefone;
    if (!telefone) { toast.error("Cliente sem telefone cadastrado."); return; }
    const numero = telefone.replace(/\D/g, "");
    const phone = numero.startsWith("55") ? numero : `55${numero}`;
    const veiculo = os.veiculo ? `${os.veiculo.modelo} (${os.veiculo.placa})` : "veículo";
    const itensTexto = orc.itens.map((it) => `• ${it.descricao} (${it.qtd}x) — R$ ${Number(it.valorLinha).toFixed(2)}`).join("\n");
    const msg =
      `Olá! Segue o orçamento *#${orc.numero}* para o ${veiculo}:\n\n` +
      `${itensTexto}\n\n` +
      `*Total: R$ ${Number(orc.total).toFixed(2)}*\n\nAguardamos seu retorno!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) return <SkeletonCard lines={5} />;
  if (!os) return <div className="card">OS não encontrada.</div>;

  const corStatus = STATUS_COR[os.status] ?? "#8b8d9e";

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="h2">OS #{os.numero}</h2>
          <div className="sub">
            {os.veiculo ? (
              <>
                <Link to={`/veiculos/${os.veiculo.id}`} style={{ fontWeight: 900, textDecoration: "none" }}>
                  {os.veiculo.modelo} ({os.veiculo.placa})
                </Link>
                {os.veiculo.cliente && <> · {os.veiculo.cliente.nome}</>}
              </>
            ) : `Veículo #${os.veiculoId}`}
            {" · "}{os.categoria} · {formatPtBr(os.dataServico)}
          </div>
          <div style={{ marginTop: 6 }}>
            <span className="badge" style={{ color: corStatus, borderColor: corStatus, background: `${corStatus}18` }}>
              {os.status}
            </span>
          </div>
        </div>

        <div className="page-header-actions">
          {/* Seletor de status */}
          <select
            className="select"
            value={os.status}
            disabled={changingStatus}
            onChange={(e) => handleChangeStatus(e.target.value)}
            style={{ maxWidth: 180 }}
          >
            {STATUS_OS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Link to="/registros" className="btn">Voltar</Link>
        </div>
      </div>

      {/* Descrição */}
      <div className="card" style={{ marginBottom: 12, padding: "12px 16px" }}>
        <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>Descrição: </span>
        {os.descricao}
        {os.observacoes && (
          <><br /><span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>Obs: </span>{os.observacoes}</>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === "orcamentos" ? "active" : ""}`} onClick={() => setActiveTab("orcamentos")} type="button">
          Orçamentos <span className="badge" style={{ marginLeft: 6 }}>{os.orcamentos.length}</span>
        </button>
        <button className={`tab-btn ${activeTab === "laudo" ? "active" : ""}`} onClick={() => setActiveTab("laudo")} type="button">
          Laudo de Entrada
        </button>
        <button className={`tab-btn ${activeTab === "fotos" ? "active" : ""}`} onClick={() => setActiveTab("fotos")} type="button">
          Fotos <span className="badge" style={{ marginLeft: 6 }}>{os.fotos.length}</span>
        </button>
      </div>

      {/* ABA: ORÇAMENTOS */}
      {activeTab === "orcamentos" && (
        <div className="card">
          <div className="page-header" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Orçamentos desta OS</h3>
            <button className="btn btnPrimary" type="button" onClick={() => setShowOrcForm((v) => !v)}>
              {showOrcForm ? "Cancelar" : "+ Novo Orçamento"}
            </button>
          </div>

          {/* Formulário de novo orçamento */}
          {showOrcForm && (
            <form onSubmit={handleCriarOrcamento} style={{ marginBottom: 20, background: "var(--surface2)", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>Novo Orçamento</div>
                {templates.length > 0 && (
                  <select
                    className="select"
                    style={{ maxWidth: 240, fontSize: 13 }}
                    defaultValue=""
                    onChange={(e) => {
                      const tpl = templates.find((t) => t.id === Number(e.target.value));
                      if (tpl) {
                        setOrcItens(tpl.itens.map((it) => ({ descricao: it.descricao, qtd: it.qtd, precoUnit: it.precoUnit })));
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>Usar template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                )}
              </div>
              {orcItens.map((item, idx) => (
                <div key={idx} className="orc-item-row">
                  <div className="field-wrap orc-desc">
                    <input
                      className="input"
                      placeholder="Descrição do serviço/peça *"
                      value={item.descricao}
                      onChange={(e) => updateItem(idx, "descricao", e.target.value)}
                      required
                    />
                  </div>
                  <div className="field-wrap orc-qty">
                    <input
                      className="input"
                      type="number"
                      min={1}
                      placeholder="Qtd"
                      value={item.qtd}
                      onChange={(e) => updateItem(idx, "qtd", Number(e.target.value))}
                    />
                  </div>
                  <div className="field-wrap orc-price">
                    <input
                      className="input"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="R$ unit."
                      value={item.precoUnit}
                      onChange={(e) => updateItem(idx, "precoUnit", Number(e.target.value))}
                    />
                  </div>
                  <span className="orc-subtotal">
                    R$ {(item.qtd * item.precoUnit).toFixed(2)}
                  </span>
                  {orcItens.length > 1 && (
                    <button className="btn btnRed" type="button" onClick={() => removeItem(idx)} style={{ padding: "4px 10px", flexShrink: 0 }}>✕</button>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <button className="btn btnGray" type="button" onClick={addItem}>+ Item</button>
                <span style={{ marginLeft: "auto", fontWeight: 900 }}>Total: R$ {orcTotal.toFixed(2)}</span>
                <button className="btn btnPrimary" type="submit" disabled={savingOrc}>
                  {savingOrc ? "Salvando..." : "Criar Orçamento"}
                </button>
              </div>
            </form>
          )}

          {/* Lista de orçamentos */}
          {os.orcamentos.length === 0 ? (
            <div className="sub" style={{ padding: "12px 0" }}>
              Nenhum orçamento criado. Clique em "Novo Orçamento" para adicionar.
            </div>
          ) : (
            <div className="table-scroll">
              <table className="table table-min-md table-cards">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {os.orcamentos.map((orc) => {
                    const corOrc = STATUS_ORC_COR[orc.status] ?? "#8b8d9e";
                    return (
                      <tr key={orc.id}>
                        <td data-label="#">
                          <Link to={`/orcamentos/${orc.id}`} style={{ fontWeight: 900, textDecoration: "none", color: "var(--primary)" }}>
                            #{orc.numero}
                          </Link>
                        </td>
                        <td data-label="Status">
                          <select
                            className="select"
                            value={orc.status}
                            style={{ padding: "2px 8px", minHeight: "auto", fontSize: 13 }}
                            onChange={async (e) => {
                              try {
                                const res = await api.patch(`/orcamento/${orc.id}/status`, { status: e.target.value });
                                queryClient.setQueryData<OS>(["os", osId], (prev) => prev
                                  ? { ...prev, orcamentos: prev.orcamentos.map((o) => o.id === orc.id ? { ...o, status: res.data.status } : o) }
                                  : prev
                                );
                              } catch { toast.error("Erro ao atualizar status."); }
                            }}
                          >
                            {STATUS_ORC.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td data-label="Itens">{orc.itens.length}</td>
                        <td data-label="Total" style={{ fontWeight: 900 }}>R$ {Number(orc.total).toFixed(2)}</td>
                        <td data-label="Data">{formatPtBr(orc.createdAt)}</td>
                        <td>
                          <div className="action-group">
                            <button className="btn" type="button" style={{ background: "#25D366", borderColor: "#25D366", color: "#fff" }} onClick={() => handleWhatsApp(orc)}>WA</button>
                            <button className="btn btnPrimary" type="button" onClick={() => handlePdf(orc.id)}>PDF</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA: LAUDO */}
      {activeTab === "laudo" && (
        <div className="card">
          <div className="page-header" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Laudo de Entrada</h3>
            <div className="page-header-actions">
              {!laudoEditMode ? (
                <button className="btn btnBlue" type="button" onClick={() => {
                  setLaudoEditMode(true);
                  if (os.laudo) { populateLaudo(os.laudo); } else { setAvariasEdit({}); setKmEdit(""); setNivelEdit(""); setObsLaudoEdit(""); }
                }}>
                  {os.laudo ? "Editar laudo" : "Registrar entrada"}
                </button>
              ) : (
                <button className="btn btnGray" type="button" onClick={() => {
                  setLaudoEditMode(false);
                  if (os.laudo) populateLaudo(os.laudo);
                }}>
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {laudoEditMode ? (
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
                  <input className="input" placeholder="Opcional" value={obsLaudoEdit} onChange={(e) => setObsLaudoEdit(e.target.value)} />
                </div>
              </div>
              <ChecklistAvarias avarias={avariasEdit} onChange={setAvariasEdit} />
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btnPrimary" disabled={savingLaudo}>
                  {savingLaudo ? "Salvando..." : "Salvar laudo"}
                </button>
              </div>
            </form>
          ) : os.laudo ? (
            <div>
              <div className="detail-grid" style={{ marginBottom: 16 }}>
                {os.laudo.km && (
                  <div className="detail-span-4">
                    <div className="sub" style={{ fontSize: 11 }}>KM</div>
                    <div style={{ fontWeight: 700 }}>{os.laudo.km.toLocaleString("pt-BR")} km</div>
                  </div>
                )}
                {os.laudo.nivelCombust && (
                  <div className="detail-span-4">
                    <div className="sub" style={{ fontSize: 11 }}>Combustível</div>
                    <div style={{ fontWeight: 700 }}>{os.laudo.nivelCombust}</div>
                  </div>
                )}
                {os.laudo.observacoes && (
                  <div className="detail-span-4">
                    <div className="sub" style={{ fontSize: 11 }}>Observações</div>
                    <div>{os.laudo.observacoes}</div>
                  </div>
                )}
              </div>
              <ChecklistAvarias
                avarias={Object.fromEntries(
                  os.laudo.avarias.map((a) => [a.zona, { zona: a.zona as any, severidade: a.severidade as any, observacao: a.observacao ?? undefined }])
                )}
                readonly
              />
            </div>
          ) : (
            <div className="sub" style={{ padding: "12px 0" }}>
              Nenhum laudo registrado. Clique em "Registrar entrada" para criar.
            </div>
          )}
        </div>
      )}

      {/* ABA: FOTOS */}
      {activeTab === "fotos" && (
        <div className="card">
          <div className="page-header" style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Fotos do Veículo</h3>
          </div>
          <FotoUpload registroTecnicoId={osId} />
        </div>
      )}
    </div>
  );
}
