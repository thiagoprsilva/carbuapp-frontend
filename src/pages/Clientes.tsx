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
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [creating, setCreating] = useState(false);
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
      <div className="page-header">
        <div>
          <h2 className="h2">Clientes</h2>
          <div className="sub">Cadastre e gerencie seus clientes.</div>
        </div>
      </div>

      <div className="card card-section">
        <form onSubmit={handleCreate} className="inline-form">
          <div className="field-wide">
            <input className="input" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="field-medium">
            <input className="input" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>

          <button type="submit" disabled={creating} className="btn btnPrimary">
            {creating ? "Salvando..." : "Novo Cliente"}
          </button>
        </form>
      </div>

      {loadingList ? (
        <div className="card">Carregando...</div>
      ) : (
        <div className="card">
          <div className="table-scroll">
            <table className="table table-min-md">
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
                        <td>
                          {isEditing ? (
                            <input className="input" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                          ) : (
                            <Link to={`/clientes/${c.id}`} style={{ textDecoration: "none", fontWeight: 900 }}>
                              {c.nome}
                            </Link>
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <input className="input" value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} />
                          ) : (
                            c.telefone ?? "-"
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <div className="action-group">
                              <button onClick={() => saveEdit(c.id)} className="btn btnPrimary" type="button">
                                Salvar
                              </button>

                              <button onClick={cancelEdit} className="btn btnGray" type="button">
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="action-group">
                              <button onClick={() => startEdit(c)} className="btn btnBlue" type="button">
                                Editar
                              </button>

                              <button onClick={() => handleDelete(c.id, c.nome)} className="btn btnRed" type="button">
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
