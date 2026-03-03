import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

type Cliente = {
  id: number;
  nome: string;
  telefone?: string | null;
  createdAt: string;
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // create
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  // ui
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);

  // edit mode
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");

  async function loadClientes() {
    setLoadingList(true);
    try {
      const res = await api.get<Cliente[]>("/clientes");
      setClientes(res.data);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadClientes();
  }, []);

  // CREATE
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!nome.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }

    setCreating(true);
    try {
      await api.post("/clientes", {
        nome: nome.trim(),
        telefone: telefone.trim() || undefined,
      });

      setNome("");
      setTelefone("");
      await loadClientes();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erro ao criar cliente.");
    } finally {
      setCreating(false);
    }
  }

  // ENTER EDIT MODE
  function startEdit(cliente: Cliente) {
    setEditId(cliente.id);
    setEditNome(cliente.nome);
    setEditTelefone(cliente.telefone ?? "");
  }

  function cancelEdit() {
    setEditId(null);
    setEditNome("");
    setEditTelefone("");
  }

  // UPDATE
  async function saveEdit(clienteId: number) {
    if (!editNome.trim()) {
      alert("Nome não pode ficar vazio.");
      return;
    }

    try {
      await api.put(`/clientes/${clienteId}`, {
        nome: editNome.trim(),
        telefone: editTelefone.trim() || null,
      });

      cancelEdit();
      await loadClientes();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erro ao atualizar cliente.");
    }
  }

  // DELETE
  async function handleDelete(clienteId: number, clienteNome: string) {
    const ok = confirm(`Tem certeza que deseja remover o cliente "${clienteNome}"?`);
    if (!ok) return;

    try {
      await api.delete(`/clientes/${clienteId}`);
      await loadClientes();
    } catch (err: any) {
      // aqui vai aparecer a mensagem do backend (ex.: tem veículos)
      alert(err?.response?.data?.message ?? "Erro ao remover cliente.");
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 14 }}>Clientes</h2>

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} style={{ marginBottom: 18, display: "flex", gap: 10 }}>
        <input
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            width: 260,
          }}
        />

        <input
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          style={{
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 4,
            background: "#fff",
            width: 200,
          }}
        />

        <button
          type="submit"
          disabled={creating}
          style={{
            padding: "10px 16px",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {creating ? "Salvando..." : "Novo Cliente"}
        </button>
      </form>

      {/* LIST */}
      {loadingList ? (
        <div>Carregando...</div>
      ) : (
        <table style={{ width: "100%", background: "#fff", border: "1px solid #eee" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Nome</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Telefone</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 12, opacity: 0.7 }}>
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            ) : (
              clientes.map((c) => {
                const isEditing = editId === c.id;

                return (
                  <tr key={c.id}>
                    {/* NOME */}
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <input
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          style={{
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            width: "100%",
                            background: "#fff",
                          }}
                        />
                      ) : (
                        <Link
                          to={`/clientes/${c.id}`}
                          style={{
                            color: "#2563eb",
                            textDecoration: "none",
                            fontWeight: 700,
                          }}
                        >
                          {c.nome}
                        </Link>
                      )}
                    </td>

                    {/* TELEFONE */}
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <input
                          value={editTelefone}
                          onChange={(e) => setEditTelefone(e.target.value)}
                          style={{
                            padding: 8,
                            border: "1px solid #ccc",
                            borderRadius: 4,
                            width: 220,
                            background: "#fff",
                          }}
                        />
                      ) : (
                        c.telefone ?? "-"
                      )}
                    </td>

                    {/* AÇÕES */}
                    <td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => saveEdit(c.id)}
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
                            onClick={() => startEdit(c)}
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
                            onClick={() => handleDelete(c.id, c.nome)}
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