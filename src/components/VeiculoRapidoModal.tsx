import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";

const ALIMENTACAO_OPCOES = ["", "Gasolina", "Flex", "Etanol", "Diesel"] as const;

type Cliente = { id: number; nome: string };

type VeiculoCriado = {
  id: number;
  placa: string;
  modelo: string;
  cliente?: { id: number; nome: string };
};

type Props = {
  open: boolean;
  clientes: Cliente[];
  clienteIdInicial?: number;
  onClose: () => void;
  onSuccess: (veiculo: VeiculoCriado) => void;
};

export default function VeiculoRapidoModal({
  open,
  clientes,
  clienteIdInicial,
  onClose,
  onSuccess,
}: Props) {
  const [clienteId, setClienteId] = useState<number>(0);
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [motor, setMotor] = useState("");
  const [alimentacao, setAlimentacao] = useState("");
  const [saving, setSaving] = useState(false);
  const primeiroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setClienteId(clienteIdInicial ?? (clientes[0]?.id ?? 0));
    setPlaca("");
    setModelo("");
    setAno("");
    setMotor("");
    setAlimentacao("");
    setTimeout(() => primeiroInputRef.current?.focus(), 50);
  }, [open, clientes, clienteIdInicial]);

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

    if (!clienteId) { toast.error("Selecione o cliente."); return; }
    if (!placa.trim() || !modelo.trim()) {
      toast.error("Placa e modelo são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post<VeiculoCriado>("/veiculos", {
        clienteId,
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        ano: ano.trim() || null,
        motor: motor.trim() || null,
        alimentacao: alimentacao || null,
      });
      toast.success(`Veículo ${res.data.placa} cadastrado!`);
      onSuccess(res.data);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao criar veículo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: "min(100%, 480px)" }} onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">Cadastrar Veículo Rápido</p>
        <p className="modal-message" style={{ marginBottom: 16 }}>
          Campos mínimos. Você pode completar os detalhes depois em Veículos.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label className="form-label">
            Cliente <span style={{ color: "#dc2626" }}>*</span>
            <select
              className="select"
              value={clienteId}
              onChange={(e) => setClienteId(Number(e.target.value))}
            >
              {clientes.length === 0 ? (
                <option value={0}>Nenhum cliente cadastrado</option>
              ) : (
                clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))
              )}
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <label className="form-label">
              Placa <span style={{ color: "#dc2626" }}>*</span>
              <input
                ref={primeiroInputRef}
                className="input"
                placeholder="ABC1D23"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              />
            </label>
            <label className="form-label">
              Modelo <span style={{ color: "#dc2626" }}>*</span>
              <input
                className="input"
                placeholder="Ex: Gol 1.0 2020"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label className="form-label">
              Ano
              <input
                className="input"
                placeholder="2020"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                maxLength={4}
              />
            </label>
            <label className="form-label">
              Motor
              <input
                className="input"
                placeholder="1.0"
                value={motor}
                onChange={(e) => setMotor(e.target.value)}
              />
            </label>
            <label className="form-label">
              Combustível
              <select
                className="select"
                value={alimentacao}
                onChange={(e) => setAlimentacao(e.target.value)}
              >
                {ALIMENTACAO_OPCOES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt || "—"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btnGray" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btnPrimary"
              disabled={saving || clientes.length === 0}
            >
              {saving ? "Salvando..." : "Cadastrar Veículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
