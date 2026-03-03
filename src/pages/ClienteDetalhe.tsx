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

  async function load() {
    setLoading(true);
    try {
      // precisa existir no backend:
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

  if (loading) return <div>Carregando...</div>;
  if (!cliente) return <div>Cliente não encontrado.</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Detalhe do Cliente</h2>
          <div style={{ fontSize: 18, fontWeight: 900 }}>{cliente.nome}</div>
          <div style={{ opacity: 0.8 }}>Telefone: {cliente.telefone ?? "-"}</div>
        </div>

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

      <div style={{ marginTop: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
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
                      style={{ color: "#2563eb", textDecoration: "none", fontWeight: 800 }}
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