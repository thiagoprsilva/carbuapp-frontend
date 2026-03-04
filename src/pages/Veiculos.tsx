import { useEffect, useState } from "react";
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

export default function Veiculos() {
  // dropdown de clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  // lista de veículos
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // create
  const [clienteId, setClienteId] = useState<number>(0);
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [motor, setMotor] = useState("");
  const [alimentacao, setAlimentacao] = useState("");
  const [creating, setCreating] = useState(false);

  // edit mode
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

  // CREATE
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

      // limpa form
      setPlaca("");
      setModelo("");
      setAno("");
      setMotor("");
      setAlimentacao("");

      await loadVeiculos();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erro ao criar veículo.");
    } finally {
      setCreating(false);
    }
  }

  // ENTER EDIT MODE
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

  // UPDATE
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
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erro ao atualizar veículo.");
    }
  }

  // DELETE
  async function handleDelete(id: number, label: string) {
    const ok = confirm(`Tem certeza que deseja remover o veículo "${label}"?`);
    if (!ok) return;

    try {
      await api.delete(`/veiculos/${id}`);
      await loadVeiculos();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erro ao remover veículo.");
    }
  }

  return (
    <div>
      {/* HEADER */}
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="h2">Veículos</h2>
          <div className="sub">Cadastre e gerencie os veículos dos clientes.</div>
        </div>
        <span className="badge">{veiculos.length} veículo(s)</span>
      </div>

      {/* CREATE FORM */}
      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            className="select"
            value={clienteId}
            onChange={(e) => setClienteId(Number(e.target.value))}
            disabled={loadingClientes || clientes.length === 0}
            style={{ minWidth: 260 }}
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

          <button type="submit" disabled={creating || clientes.length === 0} className="btn btnPrimary">
            {creating ? "Salvando..." : "Novo Veículo"}
          </button>
        </form>
      </div>

      {/* LIST */}
      {loadingList ? (
        <div className="card">Carregando...</div>
      ) : (
        <div className="card">
          <table className="table">
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
                      {/* CLIENTE */}
                      <td>
                        {isEditing ? (
                          <select
                            className="select"
                            value={editClienteId}
                            onChange={(e) => setEditClienteId(Number(e.target.value))}
                            style={{ width: 220 }}
                          >
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

                      {/* PLACA */}
                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editPlaca}
                            onChange={(e) => setEditPlaca(e.target.value.toUpperCase())}
                            style={{ width: 140 }}
                          />
                        ) : (
                          v.placa
                        )}
                      </td>

                      {/* MODELO (com link pro detalhe) */}
                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editModelo}
                            onChange={(e) => setEditModelo(e.target.value)}
                            style={{ width: 220 }}
                          />
                        ) : (
                          <Link to={`/veiculos/${v.id}`} style={{ textDecoration: "none", fontWeight: 900 }}>
                            {v.modelo}
                          </Link>
                        )}
                      </td>

                      <td>{isEditing ? <input className="input" value={editAno} onChange={(e) => setEditAno(e.target.value)} style={{ width: 110 }} /> : v.ano ?? "-"}</td>

                      <td>
                        {isEditing ? (
                          <input className="input" value={editMotor} onChange={(e) => setEditMotor(e.target.value)} style={{ width: 160 }} />
                        ) : (
                          v.motor ?? "-"
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editAlimentacao}
                            onChange={(e) => setEditAlimentacao(e.target.value)}
                            style={{ width: 180 }}
                          />
                        ) : (
                          v.alimentacao ?? "-"
                        )}
                      </td>

                      {/* AÇÕES */}
                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => saveEdit(v.id)} className="btn btnPrimary">
                              Salvar
                            </button>
                            <button onClick={cancelEdit} className="btn btnGray">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => startEdit(v)} className="btn btnBlue">
                              Editar
                            </button>
                            <button onClick={() => handleDelete(v.id, `${v.modelo} (${v.placa})`)} className="btn btnRed">
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
      )}
    </div>
  );
}