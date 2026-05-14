import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";

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
  registroTecnicoId?: number | null;
  registroTecnico?: { id: number; numero: number; status: string } | null;
  veiculo?: {
    id: number;
    modelo: string;
    placa: string;
    cliente?: { id: number; nome: string; telefone?: string | null } | null;
  };
  itens: OrcamentoItem[];
};

const STATUS_COR: Record<string, string> = {
  Pendente:  "#f59e0b",
  Aprovado:  "#60a5fa",
  Executado: "#4ade80",
  Rejeitado: "#f87171",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function OrcamentoDetalhe() {
  const { id } = useParams();
  const orcamentoId = Number(id);

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOrcamento() {
    setLoading(true);
    try {
      const res = await api.get<Orcamento>(`/orcamento/${orcamentoId}`);
      setOrcamento(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao carregar orçamento.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!orcamentoId) return;
    loadOrcamento();
  }, [orcamentoId]);

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
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="badge" style={{ color: corStatus, borderColor: corStatus, background: `${corStatus}18` }}>
              {orcamento.status}
            </span>
            <span style={{ fontWeight: 900, fontSize: 18 }}>
              R$ {Number(orcamento.total).toFixed(2)}
            </span>
            {orcamento.registroTecnico && (
              <Link
                to={`/registros/${orcamento.registroTecnico.id}`}
                className="badge"
                style={{ textDecoration: "none", color: "#f59e0b", borderColor: "#f59e0b", background: "#f59e0b18" }}
              >
                OS-{orcamento.registroTecnico.numero}
              </Link>
            )}
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
          {orcamento.registroTecnico ? (
            <Link to={`/registros/${orcamento.registroTecnico.id}`} className="btn">
              Ver OS
            </Link>
          ) : (
            <Link to="/orcamentos" className="btn">Voltar</Link>
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="card">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>
            Itens <span className="badge" style={{ marginLeft: 6 }}>{orcamento.itens.length}</span>
          </h3>
        </div>
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
              {orcamento.itens.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "1rem", opacity: 0.5 }}>
                    Nenhum item neste orçamento.
                  </td>
                </tr>
              ) : (
                orcamento.itens.map((it) => (
                  <tr key={it.id}>
                    <td data-label="Descrição">{it.descricao}</td>
                    <td data-label="Qtd">{it.qtd}</td>
                    <td data-label="Unit.">R$ {Number(it.precoUnit).toFixed(2)}</td>
                    <td data-label="Total" style={{ fontWeight: 900 }}>R$ {Number(it.valorLinha).toFixed(2)}</td>
                  </tr>
                ))
              )}
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
    </div>
  );
}
