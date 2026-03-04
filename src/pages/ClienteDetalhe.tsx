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

  // UI: Criar veículo inline
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
      await api.post("/veiculos", {
        clienteId,
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        ano: ano.trim() || null,
        motor: motor.trim() || null,
        alimentacao: alimentacao.trim() || null,
      });

      resetVeiculoForm();
      setShowCreateVeiculo(false);
      await load();
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao criar veículo.");
    } finally {
      setCreatingVeiculo(false);
    }
  }

  if (loading) return <div className="card">Carregando...</div>;
  if (!cliente) return <div className="card">Cliente não encontrado.</div>;

  return (
    <div>
      {/* HEADER */}
      <div className="row" style={{ marginBottom: 14 }}>
        <div>
          <h2 className="h2">Detalhe do Cliente</h2>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{cliente.nome}</div>
          <div className="sub">Telefone: {cliente.telefone ?? "-"}</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btnPrimary" onClick={() => setShowCreateVeiculo((v) => !v)}>
            {showCreateVeiculo ? "Fechar" : "Novo Veículo"}
          </button>

          <Link to="/clientes" className="btn">
            Voltar
          </Link>
        </div>
      </div>

      {/* FORM INLINE: NOVO VEÍCULO */}
      {showCreateVeiculo && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="row" style={{ marginBottom: 10, justifyContent: "flex-start" }}>
            <h3 style={{ margin: 0 }}>Cadastrar novo veículo</h3>
            <span className="badge">Cliente #{clienteId}</span>
          </div>

          <form onSubmit={handleCreateVeiculo} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Placa (ex: ABC1D23)"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              style={{ width: 180 }}
            />

            <input
              className="input"
              placeholder="Modelo (ex: Gol 1988)"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              style={{ width: 240 }}
            />

            <input className="input" placeholder="Ano" value={ano} onChange={(e) => setAno(e.target.value)} style={{ width: 120 }} />

            <input className="input" placeholder="Motor" value={motor} onChange={(e) => setMotor(e.target.value)} style={{ width: 180 }} />

            <input
              className="input"
              placeholder="Alimentação (Carburado/Turbo/Stage)"
              value={alimentacao}
              onChange={(e) => setAlimentacao(e.target.value)}
              style={{ width: 260 }}
            />

            <button type="submit" disabled={creatingVeiculo} className="btn btnBlue">
              {creatingVeiculo ? "Salvando..." : "Salvar Veículo"}
            </button>
          </form>
        </div>
      )}

      {/* LISTA DE VEÍCULOS */}
      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Veículos do cliente</h3>
          <span className="badge">{veiculos.length} veículo(s)</span>
        </div>

        {veiculos.length === 0 ? (
          <div className="sub">Nenhum veículo cadastrado.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Ano</th>
                <th>Motor</th>
                <th>Alimentação</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link to={`/veiculos/${v.id}`} style={{ textDecoration: "none", fontWeight: 900 }}>
                      {v.modelo} ({v.placa})
                    </Link>
                  </td>
                  <td>{v.ano ?? "-"}</td>
                  <td>{v.motor ?? "-"}</td>
                  <td>{v.alimentacao ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}