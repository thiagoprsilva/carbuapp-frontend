import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
  createdAt?: string;
};

type Veiculo = {
  id: number;
  placa: string;
  modelo: string;
  ano?: string | null;
  motor?: string | null;
  alimentacao?: string | null;
  createdAt?: string;
  clienteId: number;
};

export default function ClienteDetalhe() {
  const { id } = useParams();
  const clienteId = Number(id);

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);

  // ====== UI: Criar veículo inline ======
  const [showCreateVeiculo, setShowCreateVeiculo] = useState(false);
  const [creatingVeiculo, setCreatingVeiculo] = useState(false);

  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [motor, setMotor] = useState("");
  const [alimentacao, setAlimentacao] = useState("");

  function resetVeiculoForm() {
    setPlaca("");
    setModelo("");
    setAno("");
    setMotor("");
    setAlimentacao("");
  }

  async function load() {
    setLoading(true);
    try {
      // GET /clientes/:id
      // GET /veiculos?clienteId=...
      const [cRes, vRes] = await Promise.all([
        api.get<Cliente>(`/clientes/${clienteId}`),
        api.get<Veiculo[]>(`/veiculos`, { params: { clienteId } }),
      ]);

      setCliente(cRes.data);
      setVeiculos(vRes.data);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao carregar cliente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!clienteId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function handleCreateVeiculo(e: React.FormEvent) {
    e.preventDefault();

    if (!placa.trim() || !modelo.trim()) {
      alert("Placa e modelo são obrigatórios.");
      return;
    }

    setCreatingVeiculo(true);
    try {
      // POST /veiculos
      await api.post("/veiculos", {
        clienteId,
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        ano: ano.trim() || null,
        motor: motor.trim() || null,
        alimentacao: alimentacao.trim() || null,
      });

      // Fecha e limpa o form
      resetVeiculoForm();
      setShowCreateVeiculo(false);

      // Recarrega listagem do cliente
      await load();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao criar veículo.");
    } finally {
      setCreatingVeiculo(false);
    }
  }

  if (loading) return <div>Carregando...</div>;
  if (!cliente) return <div>Cliente não encontrado.</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>Detalhe do Cliente</h2>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{cliente.nome}</div>
          <div style={{ opacity: 0.8 }}>Telefone: {cliente.telefone ?? "-"}</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowCreateVeiculo((v) => !v)}
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              border: "1px solid #111827",
              textDecoration: "none",
              color: "#fff",
              background: "#111827",
              cursor: "pointer",
            }}
          >
            {showCreateVeiculo ? "Fechar" : "Novo Veículo"}
          </button>

          <Link
            to="/clientes"
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

      {/* FORM INLINE: NOVO VEÍCULO */}
      {showCreateVeiculo && (
        <div
          style={{
            marginTop: 16,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 14,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Cadastrar novo veículo</h3>

          <form onSubmit={handleCreateVeiculo} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              placeholder="Placa (ex: ABC1D23)"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              style={{
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                width: 180,
              }}
            />

            <input
              placeholder="Modelo (ex: Gol 1988)"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              style={{
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                width: 220,
              }}
            />

            <input
              placeholder="Ano (ex: 1988)"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              style={{
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                width: 120,
              }}
            />

            <input
              placeholder="Motor (ex: AP 1.9)"
              value={motor}
              onChange={(e) => setMotor(e.target.value)}
              style={{
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                width: 180,
              }}
            />

            <input
              placeholder="Alimentação (ex: Carburado/Turbo/Stage)"
              value={alimentacao}
              onChange={(e) => setAlimentacao(e.target.value)}
              style={{
                padding: 10,
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                width: 240,
              }}
            />

            <button
              type="submit"
              disabled={creatingVeiculo}
              style={{
                padding: "10px 16px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {creatingVeiculo ? "Salvando..." : "Salvar Veículo"}
            </button>
          </form>
        </div>
      )}

      {/* LISTA DE VEÍCULOS */}
      <div
        style={{
          marginTop: 16,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 14,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Veículos do cliente</h3>

        {veiculos.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nenhum veículo cadastrado.</div>
        ) : (
          <table style={{ width: "100%", border: "1px solid #eee" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Veículo</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Ano</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Motor</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Alimentação</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.map((v) => (
                <tr key={v.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    <Link
                      to={`/veiculos/${v.id}`}
                      style={{
                        color: "#2563eb",
                        textDecoration: "none",
                        fontWeight: 800,
                      }}
                    >
                      {v.modelo} ({v.placa})
                    </Link>
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{v.ano ?? "-"}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{v.motor ?? "-"}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{v.alimentacao ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}