import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
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
  oficinaId: number;
  createdAt: string;
  cliente?: {
    id: number;
    nome: string;
    telefone?: string | null;
  };
};

const ALIMENTACAO_OPCOES = ["Gasolina", "Flex", "Etanol", "Diesel"] as const;

export default function Veiculos() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [clienteId, setClienteId] = useState<number>(0);
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [motor, setMotor] = useState("");
  const [alimentacao, setAlimentacao] = useState("");
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editClienteId, setEditClienteId] = useState<number>(0);
  const [editPlaca, setEditPlaca] = useState("");
  const [editModelo, setEditModelo] = useState("");
  const [editAno, setEditAno] = useState("");
  const [editMotor, setEditMotor] = useState("");
  const [editAlimentacao, setEditAlimentacao] = useState("");

  async function loadClientes() {
    setLoadingClientes(true);
    try {
      const res = await api.get<Cliente[]>("/clientes");
      setClientes(res.data);
      if (res.data.length > 0) setClienteId(res.data[0].id);
    } finally {
      setLoadingClientes(false);
    }
  }

  async function loadVeiculos() {
    setLoadingList(true);
    try {
      const res = await api.get<Veiculo[]>("/veiculos");
      setVeiculos(res.data);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadClientes();
    loadVeiculos();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!clienteId) {
      alert("Selecione um cliente.");
      return;
    }
    if (!placa.trim() || !modelo.trim()) {
      alert("Placa e modelo são obrigatórios.");
      return;
    }

    setCreating(true);
    try {
      await api.post("/veiculos", {
        clienteId,
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim(),
        ano: ano.trim() || null,
        motor: motor.trim() || null,
        alimentacao: alimentacao.trim() || null,
      });

      setPlaca("");
      setModelo("");
      setAno("");
      setMotor("");
      setAlimentacao("");

      await loadVeiculos();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Erro ao criar veículo.";
        alert(message);
      } else if (err instanceof Error) {
        alert(err.message || "Erro ao criar veículo.");
      } else {
        alert("Erro ao criar veículo.");
      }
    } finally {
      setCreating(false);
    }
  }

  function startEdit(v: Veiculo) {
    setEditId(v.id);
    setEditClienteId(v.clienteId);
    setEditPlaca(v.placa);
    setEditModelo(v.modelo);
    setEditAno(v.ano ?? "");
    setEditMotor(v.motor ?? "");
    setEditAlimentacao(v.alimentacao ?? "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditClienteId(0);
    setEditPlaca("");
    setEditModelo("");
    setEditAno("");
    setEditMotor("");
    setEditAlimentacao("");
  }

  async function saveEdit(id: number) {
    if (!editClienteId) {
      alert("Selecione um cliente.");
      return;
    }
    if (!editPlaca.trim() || !editModelo.trim()) {
      alert("Placa e modelo são obrigatórios.");
      return;
    }

    try {
      await api.put(`/veiculos/${id}`, {
        clienteId: editClienteId,
        placa: editPlaca.trim().toUpperCase(),
        modelo: editModelo.trim(),
        ano: editAno.trim() || null,
        motor: editMotor.trim() || null,
        alimentacao: editAlimentacao.trim() || null,
      });

      cancelEdit();
      await loadVeiculos();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Erro ao atualizar veículo.";
        alert(message);
      } else if (err instanceof Error) {
        alert(err.message || "Erro ao atualizar veículo.");
      } else {
        alert("Erro ao atualizar veículo.");
      }
    }
  }

  async function handleDelete(id: number, label: string) {
    const ok = confirm(`Tem certeza que deseja remover o veículo "${label}"?`);
    if (!ok) return;

    try {
      await api.delete(`/veiculos/${id}`);
      await loadVeiculos();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Erro ao remover veículo.";
        alert(message);
      } else if (err instanceof Error) {
        alert(err.message || "Erro ao remover veículo.");
      } else {
        alert("Erro ao remover veículo.");
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="h2">Veículos</h2>
          <div className="sub">Cadastre e gerencie os veículos dos clientes.</div>
        </div>
        <span className="badge">{veiculos.length} veículo(s)</span>
      </div>

      <div className="card card-section">
        <form onSubmit={handleCreate} className="inline-form">
          <div className="field-wide">
            <select
              className="select"
              value={clienteId}
              onChange={(e) => setClienteId(Number(e.target.value))}
              disabled={loadingClientes || clientes.length === 0}
            >
              {clientes.length === 0 ? (
                <option value={0}>Nenhum cliente cadastrado</option>
              ) : (
                clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))
              )}
            </select>
          </div>

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

          <div className="field-medium">
            <select className="select" value={alimentacao} onChange={(e) => setAlimentacao(e.target.value)}>
              <option value="">Selecione a alimentação</option>
              {ALIMENTACAO_OPCOES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={creating || clientes.length === 0} className="btn btnPrimary">
            {creating ? "Salvando..." : "Novo Veículo"}
          </button>
        </form>
      </div>

      {loadingList ? (
        <div className="card">Carregando...</div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table className="table table-min-xl">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Placa</th>
                  <th>Modelo</th>
                  <th>Ano</th>
                  <th>Motor</th>
                  <th>Alimentação</th>
                  <th style={{ width: 260 }}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {veiculos.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 12, opacity: 0.7 }}>
                      Nenhum veículo cadastrado.
                    </td>
                  </tr>
                ) : (
                  veiculos.map((v) => {
                    const isEditing = editId === v.id;

                    return (
                      <tr key={v.id}>
                        <td>
                          {isEditing ? (
                            <select className="select" value={editClienteId} onChange={(e) => setEditClienteId(Number(e.target.value))}>
                              {clientes.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nome}
                                </option>
                              ))}
                            </select>
                          ) : (
                            v.cliente?.nome ?? `Cliente #${v.clienteId}`
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <input
                              className="input"
                              value={editPlaca}
                              onChange={(e) => setEditPlaca(e.target.value.toUpperCase())}
                            />
                          ) : (
                            v.placa
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <input className="input" value={editModelo} onChange={(e) => setEditModelo(e.target.value)} />
                          ) : (
                            <Link to={`/veiculos/${v.id}`} style={{ textDecoration: "none", fontWeight: 900 }}>
                              {v.modelo}
                            </Link>
                          )}
                        </td>

                        <td>
                          {isEditing ? <input className="input" value={editAno} onChange={(e) => setEditAno(e.target.value)} /> : v.ano ?? "-"}
                        </td>

                        <td>
                          {isEditing ? <input className="input" value={editMotor} onChange={(e) => setEditMotor(e.target.value)} /> : v.motor ?? "-"}
                        </td>

                        <td>
                          {isEditing ? (
                            <select className="select" value={editAlimentacao} onChange={(e) => setEditAlimentacao(e.target.value)}>
                              <option value="">Selecione a alimentação</option>
                              {ALIMENTACAO_OPCOES.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            v.alimentacao ?? "-"
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <div className="action-group">
                              <button onClick={() => saveEdit(v.id)} className="btn btnPrimary" type="button">
                                Salvar
                              </button>
                              <button onClick={cancelEdit} className="btn btnGray" type="button">
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="action-group">
                              <button onClick={() => startEdit(v)} className="btn btnBlue" type="button">
                                Editar
                              </button>
                              <button onClick={() => handleDelete(v.id, `${v.modelo} (${v.placa})`)} className="btn btnRed" type="button">
                                Excluir
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
