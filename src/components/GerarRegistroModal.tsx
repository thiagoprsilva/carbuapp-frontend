import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";

const CATEGORIAS = ["Manutenção", "Revisão", "Personalização", "Projeto", "Diagnóstico"] as const;

type Props = {
  open: boolean;
  orcamentoId: number;
  orcamentoNumero: number;
  veiculoId: number;
  descricaoInicial: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function GerarRegistroModal({
  open,
  orcamentoId,
  orcamentoNumero,
  veiculoId,
  descricaoInicial,
  onClose,
  onSuccess,
}: Props) {
  const [categoria, setCategoria] = useState<string>("Manutenção");
  const [descricao, setDescricao] = useState("");
  const [dataServico, setDataServico] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const primeiroInputRef = useRef<HTMLSelectElement>(null);

  // Preenche os campos cada vez que o modal abre
  useEffect(() => {
    if (!open) return;
    setCategoria("Manutenção");
    setDescricao(descricaoInicial);
    setDataServico(new Date().toISOString().split("T")[0]);
    setObservacoes(`Gerado a partir do Orçamento #${orcamentoNumero}`);
    setTimeout(() => primeiroInputRef.current?.focus(), 50);
  }, [open, descricaoInicial, orcamentoNumero]);

  // Fecha com Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!categoria.trim()) { toast.error("Selecione a categoria."); return; }
    if (!descricao.trim()) { toast.error("Descrição é obrigatória."); return; }
    if (!dataServico)      { toast.error("Informe a data do serviço."); return; }

    setSaving(true);
    try {
      await api.post("/registroTecnico", {
        veiculoId,
        categoria,
        descricao: descricao.trim(),
        dataServico,
        observacoes: observacoes.trim() || null,
        orcamentoId,
      });
      toast.success("Registro técnico criado!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao criar registro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: "min(100%, 520px)" }} onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">Gerar Registro Técnico</p>
        <p className="modal-message" style={{ marginBottom: 16 }}>
          A partir do Orçamento <b>#{orcamentoNumero}</b>. Ajuste os campos se necessário.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label className="form-label">
            Categoria
            <select
              ref={primeiroInputRef}
              className="select"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="form-label">
            Data do serviço
            <input
              className="input"
              type="date"
              value={dataServico}
              onChange={(e) => setDataServico(e.target.value)}
            />
          </label>

          <label className="form-label">
            Descrição
            <textarea
              className="input"
              rows={5}
              style={{ resize: "vertical", fontFamily: "inherit" }}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </label>

          <label className="form-label">
            Observações <span style={{ fontWeight: 400, color: "#6b7280" }}>(opcional)</span>
            <input
              className="input"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btnGray" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btnPrimary" disabled={saving}>
              {saving ? "Salvando..." : "Criar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
