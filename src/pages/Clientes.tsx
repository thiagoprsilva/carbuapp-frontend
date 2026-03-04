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
      alert(err?.response?.data?.message ?? "Erro ao remover cliente.");
    }
  }

  return (
    <div>
      {/* HEADER */}
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="h2">Clientes</h2>
          <div className="sub">Cadastre e gerencie seus clientes.</div>
        </div>
      </div>

      {/* CREATE FORM */}
      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={handleCreate} className="row" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={{ width: 280 }}
          />

          <input
            className="input"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            style={{ width: 220 }}
          />

          <button type="submit" disabled={creating} className="btn btnPrimary">
            {creating ? "Salvando..." : "Novo Cliente"}
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
                <th>Nome</th>
                <th>Telefone</th>
                <th style={{ width: 260 }}>Ações</th>
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
                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            style={{ width: "100%" }}
                          />
                        ) : (
                          <Link to={`/clientes/${c.id}`} style={{ textDecoration: "none", fontWeight: 900 }}>
                            {c.nome}
                          </Link>
                        )}
                      </td>

                      {/* TELEFONE */}
                      <td>
                        {isEditing ? (
                          <input
                            className="input"
                            value={editTelefone}
                            onChange={(e) => setEditTelefone(e.target.value)}
                            style={{ width: 220 }}
                          />
                        ) : (
                          c.telefone ?? "-"
                        )}
                      </td>

                      {/* AÇÕES */}
                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => saveEdit(c.id)} className="btn btnPrimary">
                              Salvar
                            </button>

                            <button onClick={cancelEdit} className="btn btnGray">
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => startEdit(c)} className="btn btnBlue">
                              Editar
                            </button>

                            <button onClick={() => handleDelete(c.id, c.nome)} className="btn btnRed">
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