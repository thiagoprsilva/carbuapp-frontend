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
        placa: placa.trim(),
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
        placa: editPlaca.trim(),
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
      <h2 style={{ marginBottom: 14 }}>Veículos</h2>

      {/* CREATE FORM */}
      <form
        onSubmit={handleCreate}
        style={{ marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <select
          value={clienteId}
          onChange={(e) => setClienteId(Number(e.target.value))}
          disabled={loadingClientes || clientes.length === 0}
          style={{
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            minWidth: 240,
          }}
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
          disabled={creating || clientes.length === 0}
          style={{
            padding: "10px 16px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {creating ? "Salvando..." : "Novo Veículo"}
        </button>
      </form>

      {/* LIST */}
      {loadingList ? (
        <div>Carregando...</div>
      ) : (
        <table style={{ width: "100%", background: "#fff", border: "1px solid #eee" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Cliente</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Placa</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Modelo</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Ano</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Motor</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Alimentação</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Ações</th>
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
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <select
                          value={editClienteId}
                          onChange={(e) => setEditClienteId(Number(e.target.value))}
                          style={{
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            background: "#fff",
                            width: 220,
                          }}
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
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <input
                          value={editPlaca}
                          onChange={(e) => setEditPlaca(e.target.value.toUpperCase())}
                          style={{
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            background: "#fff",
                            width: 120,
                          }}
                        />
                      ) : (
                        v.placa
                      )}
                    </td>

                    {/* MODELO */}
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <input
                          value={editModelo}
                          onChange={(e) => setEditModelo(e.target.value)}
                          style={{
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            background: "#fff",
                            width: 200,
                          }}
                        />
                      ) : (
                        <Link
                          to={`/veiculos/${v.id}`}
                          style={{ color: "#2563eb", textDecoration: "none", fontWeight: 800 }}
                        >
                          {v.modelo}
                        </Link>
                      )}
                    </td>

                    {/* ANO */}
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <input
                          value={editAno}
                          onChange={(e) => setEditAno(e.target.value)}
                          style={{
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            background: "#fff",
                            width: 90,
                          }}
                        />
                      ) : (
                        v.ano ?? "-"
                      )}
                    </td>

                    {/* MOTOR */}
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <input
                          value={editMotor}
                          onChange={(e) => setEditMotor(e.target.value)}
                          style={{
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            background: "#fff",
                            width: 160,
                          }}
                        />
                      ) : (
                        v.motor ?? "-"
                      )}
                    </td>

                    {/* ALIMENTAÇÃO */}
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <input
                          value={editAlimentacao}
                          onChange={(e) => setEditAlimentacao(e.target.value)}
                          style={{
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            background: "#fff",
                            width: 160,
                          }}
                        />
                      ) : (
                        v.alimentacao ?? "-"
                      )}
                    </td>

                    {/* AÇÕES */}
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => saveEdit(v.id)}
                            style={{
                              padding: "8px 12px",
                              background: "#111827",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Salvar
                          </button>

                          <button
                            onClick={cancelEdit}
                            style={{
                              padding: "8px 12px",
                              background: "#e5e7eb",
                              color: "#111827",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => startEdit(v)}
                            style={{
                              padding: "8px 12px",
                              background: "#2563eb",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => handleDelete(v.id, `${v.modelo} (${v.placa})`)}
                            style={{
                              padding: "8px 12px",
                              background: "#dc2626",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          >
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
      )}
    </div>
  );
}