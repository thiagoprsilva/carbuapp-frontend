import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { SkeletonCard } from "../components/Skeleton";

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
  const queryClient = useQueryClient();

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

  const { data: cliente, isLoading: loadingCliente } = useQuery<Cliente>({
    queryKey: ["cliente", clienteId],
    queryFn: async () => {
      try {
        const res = await api.get<Cliente>(`/clientes/${clienteId}`);
        return res.data;
      } catch (error: any) {
        toast.error(error?.response?.data?.message ?? "Erro ao carregar cliente.");
        throw error;
      }
    },
    enabled: !!clienteId,
  });

  const { data: veiculos = [], isLoading: loadingVeiculos } = useQuery<Veiculo[]>({
    queryKey: ["cliente-veiculos", clienteId],
    queryFn: () =>
      api.get<Veiculo[]>("/veiculos", { params: { clienteId } }).then((r) => r.data),
    enabled: !!clienteId,
  });

  const loading = loadingCliente || loadingVeiculos;

  async function handleCreateVeiculo(e: React.FormEvent) {
    e.preventDefault();

    if (!placa.trim() || !modelo.trim()) {
      toast.error("Placa e modelo são obrigatórios.");
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

      toast.success("Veículo cadastrado!");
      resetVeiculoForm();
      setShowCreateVeiculo(false);
      queryClient.invalidateQueries({ queryKey: ["cliente-veiculos", clienteId] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Erro ao criar veículo.");
    } finally {
      setCreatingVeiculo(false);
    }
  }

  if (loading) return <SkeletonCard lines={4} />;
  if (!cliente) return <div className="card">Cliente não encontrado.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h2">Detalhe do Cliente</h2>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{cliente.nome}</div>
          <div className="sub">Telefone: {cliente.telefone ?? "-"}</div>
        </div>

        <div className="page-header-actions">
          <button className="btn btnPrimary" onClick={() => setShowCreateVeiculo((v) => !v)} type="button">
            {showCreateVeiculo ? "Fechar" : "Novo Veículo"}
          </button>

          <Link to="/clientes" className="btn">
            Voltar
          </Link>
        </div>
      </div>

      {showCreateVeiculo && (
        <div className="card card-section">
          <div className="page-header" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Cadastrar novo veículo</h3>
            <span className="badge">Cliente #{clienteId}</span>
          </div>

          <form onSubmit={handleCreateVeiculo} className="inline-form">
            <div className="field-medium">
              <input
                className="input"
                placeholder="Placa (ex: ABC1D23)"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              />
            </div>

            <div className="field-wide">
              <input
                className="input"
                placeholder="Modelo (ex: Gol 1988)"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
              />
            </div>

            <div className="field-compact">
              <input className="input" placeholder="Ano" value={ano} onChange={(e) => setAno(e.target.value)} />
            </div>

            <div className="field-medium">
              <input className="input" placeholder="Motor" value={motor} onChange={(e) => setMotor(e.target.value)} />
            </div>

            <div className="field-wide">
              <input
                className="input"
                placeholder="Alimentação (Carburado/Turbo/Stage)"
                value={alimentacao}
                onChange={(e) => setAlimentacao(e.target.value)}
              />
            </div>

            <button type="submit" disabled={creatingVeiculo} className="btn btnBlue">
              {creatingVeiculo ? "Salvando..." : "Salvar Veículo"}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Veículos do cliente</h3>
          <span className="badge">{veiculos.length} veículo(s)</span>
        </div>

        {veiculos.length === 0 ? (
          <div className="sub">Nenhum veículo cadastrado.</div>
        ) : (
          <div className="table-scroll">
            <table className="table table-min-md table-cards">
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
                    <td data-label="Veículo">
                      <Link to={`/veiculos/${v.id}`} style={{ textDecoration: "none", fontWeight: 900 }}>
                        {v.modelo} ({v.placa})
                      </Link>
                    </td>
                    <td data-label="Ano">{v.ano ?? "-"}</td>
                    <td data-label="Motor">{v.motor ?? "-"}</td>
                    <td data-label="Alimentação">{v.alimentacao ?? "-"}</td>
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
