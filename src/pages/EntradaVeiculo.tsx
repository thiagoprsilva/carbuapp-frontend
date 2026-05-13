import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import ChecklistAvarias, { AvariaMap } from "../components/ChecklistAvarias";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Cliente = { id: number; nome: string; telefone?: string | null };
type Veiculo = { id: number; placa: string; modelo: string; clienteId: number };

const NIVEIS_COMBUST = ["1/4", "1/2", "3/4", "cheio"];
const CATEGORIAS = ["Revisão", "Manutenção", "Personalização", "Projeto", "Diagnóstico"];

type Step = 1 | 2 | 3;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function EntradaVeiculo() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // ─── Dados gerais ──────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // ─── Passo 1: Cliente + Veículo ────────────────────────────────────────────
  const [clienteBusca, setClienteBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteTel, setNovoClienteTel] = useState("");
  const [criandoCliente, setCriandoCliente] = useState(false);

  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);
  const [showNovoVeiculo, setShowNovoVeiculo] = useState(false);
  const [novoVeiculoModelo, setNovoVeiculoModelo] = useState("");
  const [novoVeiculoPlaca, setNovoVeiculoPlaca] = useState("");
  const [criandoVeiculo, setCriandoVeiculo] = useState(false);

  // ─── Passo 2: Laudo (opcional) ─────────────────────────────────────────────
  const [avarias, setAvarias] = useState<AvariaMap>({});
  const [km, setKm] = useState("");
  const [nivelCombust, setNivelCombust] = useState("");
  const [obsLaudo, setObsLaudo] = useState("");
  const [temLaudo, setTemLaudo] = useState(false);

  // ─── Passo 3: Detalhes da OS ───────────────────────────────────────────────
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [descricao, setDescricao] = useState("");
  const [dataServico, setDataServico] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [observacoes, setObservacoes] = useState("");
  const [criandoOS, setCriandoOS] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoadingData(true);
      try {
        const [cRes, vRes] = await Promise.all([
          api.get<Cliente[]>("/clientes"),
          api.get<Veiculo[]>("/veiculos"),
        ]);
        setClientes(cRes.data);
        setVeiculos(vRes.data);
      } catch {
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, []);

  // ─── Filtros de busca ──────────────────────────────────────────────────────

  const clientesFiltrados = clienteBusca.trim()
    ? clientes.filter(
        (c) =>
          c.nome.toLowerCase().includes(clienteBusca.toLowerCase()) ||
          (c.telefone ?? "").includes(clienteBusca)
      )
    : clientes.slice(0, 8);

  const veiculosDoCliente = clienteSelecionado
    ? veiculos.filter((v) => v.clienteId === clienteSelecionado.id)
    : [];

  // ─── Criar cliente ─────────────────────────────────────────────────────────

  async function handleCriarCliente() {
    if (!novoClienteNome.trim()) { toast.error("Nome é obrigatório."); return; }
    setCriandoCliente(true);
    try {
      const res = await api.post<Cliente>("/clientes", {
        nome: novoClienteNome.trim(),
        telefone: novoClienteTel.trim() || undefined,
      });
      setClientes((prev) => [res.data, ...prev]);
      setClienteSelecionado(res.data);
      setShowNovoCliente(false);
      setNovoClienteNome("");
      setNovoClienteTel("");
      toast.success("Cliente criado!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao criar cliente.");
    } finally {
      setCriandoCliente(false);
    }
  }

  // ─── Criar veículo ─────────────────────────────────────────────────────────

  async function handleCriarVeiculo() {
    if (!novoVeiculoModelo.trim() || !novoVeiculoPlaca.trim()) {
      toast.error("Modelo e placa são obrigatórios.");
      return;
    }
    if (!clienteSelecionado) return;
    setCriandoVeiculo(true);
    try {
      const res = await api.post<Veiculo>("/veiculos", {
        clienteId: clienteSelecionado.id,
        modelo: novoVeiculoModelo.trim(),
        placa: novoVeiculoPlaca.trim().toUpperCase(),
      });
      setVeiculos((prev) => [res.data, ...prev]);
      setVeiculoSelecionado(res.data);
      setShowNovoVeiculo(false);
      setNovoVeiculoModelo("");
      setNovoVeiculoPlaca("");
      toast.success("Veículo criado!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao criar veículo.");
    } finally {
      setCriandoVeiculo(false);
    }
  }

  // ─── Criar OS ──────────────────────────────────────────────────────────────

  async function handleCriarOS() {
    if (!veiculoSelecionado) { toast.error("Selecione um veículo."); return; }
    if (!descricao.trim()) { toast.error("Descrição é obrigatória."); return; }

    setCriandoOS(true);
    try {
      const laudoPayload = temLaudo
        ? {
            km: km ? Number(km) : undefined,
            nivelCombust: nivelCombust || undefined,
            observacoes: obsLaudo.trim() || undefined,
            avarias: Object.values(avarias).map((a) => ({
              zona: a.zona,
              severidade: a.severidade,
              observacao: a.observacao ?? undefined,
            })),
          }
        : undefined;

      const res = await api.post<{ id: number }>("/registroTecnico", {
        veiculoId: veiculoSelecionado.id,
        categoria,
        descricao: descricao.trim(),
        dataServico,
        observacoes: observacoes.trim() || undefined,
        laudo: laudoPayload,
      });

      toast.success("OS aberta com sucesso!");
      navigate(`/registros/${res.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao criar OS.");
    } finally {
      setCriandoOS(false);
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────────

  const canAdvance1 = !!clienteSelecionado && !!veiculoSelecionado;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h2">Entrada de Veículo</h2>
          <div className="sub">Registre a entrada e abra uma nova Ordem de Serviço.</div>
        </div>
      </div>

      {/* Indicador de passos */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: s <= step ? "var(--primary)" : "var(--border)",
              transition: "background .2s",
            }}
          />
        ))}
      </div>

      {/* ─── PASSO 1: Cliente + Veículo ────────────────────────────────── */}
      {step === 1 && (
        <div>
          {/* Selecionar cliente */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>1. Selecionar cliente</div>

            {clienteSelecionado ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{clienteSelecionado.nome}</div>
                  {clienteSelecionado.telefone && (
                    <div className="sub" style={{ fontSize: 12 }}>{clienteSelecionado.telefone}</div>
                  )}
                </div>
                <button
                  className="btn btnGray"
                  type="button"
                  style={{ marginLeft: "auto" }}
                  onClick={() => { setClienteSelecionado(null); setVeiculoSelecionado(null); }}
                >
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <input
                  className="input"
                  placeholder="Buscar por nome ou telefone..."
                  value={clienteBusca}
                  onChange={(e) => setClienteBusca(e.target.value)}
                  style={{ marginBottom: 10 }}
                />
                {loadingData ? (
                  <div className="sub">Carregando...</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                    {clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        className="btn"
                        type="button"
                        style={{ justifyContent: "flex-start", textAlign: "left" }}
                        onClick={() => { setClienteSelecionado(c); setClienteBusca(""); setVeiculoSelecionado(null); }}
                      >
                        <span style={{ fontWeight: 700 }}>{c.nome}</span>
                        {c.telefone && <span className="sub" style={{ marginLeft: 8, fontSize: 12 }}>{c.telefone}</span>}
                      </button>
                    ))}
                    {clientesFiltrados.length === 0 && (
                      <div className="sub">Nenhum cliente encontrado.</div>
                    )}
                  </div>
                )}

                {/* Criar novo cliente */}
                {!showNovoCliente ? (
                  <button className="btn btnBlue" type="button" style={{ marginTop: 10 }} onClick={() => setShowNovoCliente(true)}>
                    + Novo cliente
                  </button>
                ) : (
                  <div style={{ marginTop: 10, background: "var(--surface2)", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Novo cliente</div>
                    <div className="inline-form">
                      <div className="field-wrap field-wide">
                        <input className="input" placeholder="Nome *" value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} />
                      </div>
                      <div className="field-wrap field-medium">
                        <input className="input" placeholder="Telefone (opcional)" value={novoClienteTel} onChange={(e) => setNovoClienteTel(e.target.value)} />
                      </div>
                      <button className="btn btnPrimary" type="button" disabled={criandoCliente} onClick={handleCriarCliente}>
                        {criandoCliente ? "..." : "Criar"}
                      </button>
                      <button className="btn btnGray" type="button" onClick={() => setShowNovoCliente(false)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Selecionar veículo */}
          {clienteSelecionado && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>2. Selecionar veículo</div>

              {veiculoSelecionado ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{veiculoSelecionado.modelo}</div>
                    <div className="sub" style={{ fontSize: 12 }}>{veiculoSelecionado.placa}</div>
                  </div>
                  <button className="btn btnGray" type="button" style={{ marginLeft: "auto" }} onClick={() => setVeiculoSelecionado(null)}>
                    Trocar
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {veiculosDoCliente.length === 0 ? (
                      <div className="sub">Nenhum veículo cadastrado para este cliente.</div>
                    ) : (
                      veiculosDoCliente.map((v) => (
                        <button
                          key={v.id}
                          className="btn"
                          type="button"
                          style={{ justifyContent: "flex-start", textAlign: "left" }}
                          onClick={() => setVeiculoSelecionado(v)}
                        >
                          <span style={{ fontWeight: 700 }}>{v.modelo}</span>
                          <span className="sub" style={{ marginLeft: 8, fontSize: 12 }}>{v.placa}</span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Criar novo veículo */}
                  {!showNovoVeiculo ? (
                    <button className="btn btnBlue" type="button" style={{ marginTop: 10 }} onClick={() => setShowNovoVeiculo(true)}>
                      + Novo veículo
                    </button>
                  ) : (
                    <div style={{ marginTop: 10, background: "var(--surface2)", borderRadius: 8, padding: 14 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Novo veículo</div>
                      <div className="inline-form">
                        <div className="field-wrap field-wide">
                          <input className="input" placeholder="Modelo *" value={novoVeiculoModelo} onChange={(e) => setNovoVeiculoModelo(e.target.value)} />
                        </div>
                        <div className="field-wrap field-medium">
                          <input className="input" placeholder="Placa *" value={novoVeiculoPlaca} onChange={(e) => setNovoVeiculoPlaca(e.target.value)} />
                        </div>
                        <button className="btn btnPrimary" type="button" disabled={criandoVeiculo} onClick={handleCriarVeiculo}>
                          {criandoVeiculo ? "..." : "Criar"}
                        </button>
                        <button className="btn btnGray" type="button" onClick={() => setShowNovoVeiculo(false)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="btn btnGray" type="button" onClick={() => navigate(-1)}>Cancelar</button>
            <button className="btn btnPrimary" type="button" disabled={!canAdvance1} onClick={() => setStep(2)}>
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* ─── PASSO 2: Laudo (opcional) ─────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Laudo de entrada (opcional)</div>
            <div className="sub" style={{ marginBottom: 16 }}>
              Registre avarias, KM e nível de combustível. Você pode pular esta etapa.
            </div>

            {!temLaudo ? (
              <button className="btn btnBlue" type="button" onClick={() => setTemLaudo(true)}>
                Registrar laudo de entrada
              </button>
            ) : (
              <>
                <div className="inline-form" style={{ marginBottom: 16 }}>
                  <div className="field-wrap field-medium">
                    <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>KM atual</label>
                    <input className="input" type="number" placeholder="Ex: 45000" value={km} onChange={(e) => setKm(e.target.value)} />
                  </div>
                  <div className="field-wrap field-medium">
                    <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Nível de combustível</label>
                    <select className="select" value={nivelCombust} onChange={(e) => setNivelCombust(e.target.value)}>
                      <option value="">Selecione</option>
                      {NIVEIS_COMBUST.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="field-wrap field-wide">
                    <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Observações</label>
                    <input className="input" placeholder="Opcional" value={obsLaudo} onChange={(e) => setObsLaudo(e.target.value)} />
                  </div>
                </div>
                <ChecklistAvarias avarias={avarias} onChange={setAvarias} />
                <button className="btn btnGray" type="button" style={{ marginTop: 12 }} onClick={() => { setTemLaudo(false); setAvarias({}); setKm(""); setNivelCombust(""); setObsLaudo(""); }}>
                  Remover laudo
                </button>
              </>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="btn btnGray" type="button" onClick={() => setStep(1)}>← Voltar</button>
            <button className="btn" type="button" onClick={() => setStep(3)}>
              {temLaudo ? "Próximo →" : "Pular →"}
            </button>
          </div>
        </div>
      )}

      {/* ─── PASSO 3: Confirmar OS ──────────────────────────────────────── */}
      {step === 3 && (
        <div>
          {/* Resumo */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Resumo da entrada</div>
            <div className="detail-grid">
              <div className="detail-span-4">
                <div className="sub" style={{ fontSize: 11 }}>Cliente</div>
                <div style={{ fontWeight: 700 }}>{clienteSelecionado?.nome}</div>
              </div>
              <div className="detail-span-4">
                <div className="sub" style={{ fontSize: 11 }}>Veículo</div>
                <div style={{ fontWeight: 700 }}>{veiculoSelecionado?.modelo} ({veiculoSelecionado?.placa})</div>
              </div>
              {temLaudo && (
                <div className="detail-span-4">
                  <div className="sub" style={{ fontSize: 11 }}>Laudo</div>
                  <div>
                    {km && `${km} km`}
                    {km && nivelCombust && " · "}
                    {nivelCombust && `Combustível: ${nivelCombust}`}
                    {" · "}
                    {Object.keys(avarias).length} zona(s) marcada(s)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detalhes da OS */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Detalhes da Ordem de Serviço</div>

            <div className="inline-form">
              <div className="field-wrap field-medium">
                <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Categoria</label>
                <select className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field-wrap field-medium">
                <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Data</label>
                <input className="input" type="date" value={dataServico} onChange={(e) => setDataServico(e.target.value)} />
              </div>
            </div>

            <div className="field-wrap" style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Descrição *</label>
              <input
                className="input"
                placeholder="Ex: Revisão completa, Troca de óleo, Diagnóstico..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="field-wrap" style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Observações (opcional)</label>
              <input className="input" placeholder="Opcional" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button className="btn btnGray" type="button" onClick={() => setStep(2)}>← Voltar</button>
            <button
              className="btn btnPrimary"
              type="button"
              disabled={!descricao.trim() || criandoOS}
              onClick={handleCriarOS}
            >
              {criandoOS ? "Abrindo OS..." : "🔧 Abrir OS"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
