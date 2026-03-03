import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
};

type Veiculo = {
  id: number;
  placa: string;
  modelo: string;
  ano?: string | null;
  motor?: string | null;
  alimentacao?: string | null;
  clienteId: number;
  cliente?: Cliente;
};

type RegistroTecnico = {
  id: number;
  categoria: string;
  descricao: string;
  dataServico: string;
  observacoes?: string | null;
  createdAt: string;
  veiculoId: number;
  orcamentoId?: number | null;
  orcamento?: { id: number; numero: number } | null;
};

type OrcamentoItem = {
  id: number;
  descricao: string;
  qtd: number;
  precoUnit: number;
  valorLinha: number;
  orcamentoId: number;
};

type Orcamento = {
  id: number;
  numero: number;
  total: number;
  createdAt: string;
  veiculoId: number;
  itens: OrcamentoItem[];
};

export default function VeiculoDetalhe() {
  const { id } = useParams();
  const veiculoId = Number(id);

  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [registros, setRegistros] = useState<RegistroTecnico[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // precisa existir no backend:
      // GET /veiculos/:id
      // GET /registroTecnico?veiculoId=...
      // GET /orcamento?veiculoId=...
      const [vRes, rRes, oRes] = await Promise.all([
        api.get<Veiculo>(`/veiculos/${veiculoId}`),
        api.get<RegistroTecnico[]>(`/registroTecnico`, { params: { veiculoId } }),
        api.get<Orcamento[]>(`/orcamento`, { params: { veiculoId } }),
      ]);

      setVeiculo(vRes.data);
      setRegistros(rRes.data);
      setOrcamentos(oRes.data);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao carregar veículo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!veiculoId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veiculoId]);

  async function handlePdf(orcamentoId: number) {
    try {
      const res = await api.get(`/orcamento/${orcamentoId}/pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error: any) {
      alert(error?.response?.data?.message ?? "Erro ao gerar PDF.");
    }
  }

  function formatPtBr(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  if (loading) return <div>Carregando...</div>;
  if (!veiculo) return <div>Veículo não encontrado.</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Detalhe do Veículo</h2>
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            {veiculo.modelo} ({veiculo.placa})
          </div>
          <div style={{ opacity: 0.85 }}>
            Cliente:{" "}
            <Link to={`/clientes/${veiculo.clienteId}`} style={{ color: "#2563eb", textDecoration: "none" }}>
              {veiculo.cliente?.nome ?? `Cliente #${veiculo.clienteId}`}
            </Link>
          </div>
          <div style={{ opacity: 0.8 }}>
            Ano: {veiculo.ano ?? "-"} | Motor: {veiculo.motor ?? "-"} | Alimentação: {veiculo.alimentacao ?? "-"}
          </div>
        </div>

        <Link
          to="/veiculos"
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

      {/* REGISTROS */}
      <div style={{ marginTop: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Histórico Técnico</h3>

        {registros.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nenhum registro técnico encontrado.</div>
        ) : (
          <table style={{ width: "100%", border: "1px solid #eee" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Data</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Categoria</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Descrição</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Orçamento</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{formatPtBr(r.dataServico)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{r.categoria}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{r.descricao}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    {r.orcamento ? `#${r.orcamento.numero}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ORÇAMENTOS */}
      <div style={{ marginTop: 16, background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
        <h3 style={{ marginTop: 0 }}>Orçamentos</h3>

        {orcamentos.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nenhum orçamento encontrado.</div>
        ) : (
          <table style={{ width: "100%", border: "1px solid #eee" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Número</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Data</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Total</th>
                <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((o) => (
                <tr key={o.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>#{o.numero}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{formatPtBr(o.createdAt)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>R$ {Number(o.total).toFixed(2)}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                    <button
                      onClick={() => handlePdf(o.id)}
                      style={{
                        padding: "8px 12px",
                        background: "#111827",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}