import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

type Oficina = {
  id: number;
  nome: string;
};

type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  oficinaId: number | null;
  oficina?: { nome: string } | null;
};

const ROLES = ["ADMIN", "MECANICO"];

export default function SuperadminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro por oficina
  const [filtroOficinaId, setFiltroOficinaId] = useState<string>("todos");

  // Formulário novo usuário
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoRole, setNovoRole] = useState("MECANICO");
  const [novoOficinaId, setNovoOficinaId] = useState<string>("");
  const [savingUsuario, setSavingUsuario] = useState(false);

  // Edição inline
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editRole, setEditRole] = useState("");

  // Reset de senha
  const [resetId, setResetId] = useState<number | null>(null);
  const [novaSenhaReset, setNovaSenhaReset] = useState("");

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  async function carregarDados() {
    try {
      setLoading(true);
      const [usersRes, oficinasRes] = await Promise.all([
        api.get<Usuario[]>("/usuarios"),
        api.get<Oficina[]>("/oficinas"),
      ]);
      setUsuarios(usersRes.data);
      setOficinas(oficinasRes.data);
    } catch {
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarDados(); }, []);

  // ─── Usuário: criar ──────────────────────────────────────────────────────────
  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim() || !novoOficinaId) {
      toast.error("Preencha todos os campos.");
      return;
    }
    try {
      setSavingUsuario(true);
      await api.post("/usuarios", {
        nome: novoNome.trim(),
        email: novoEmail.trim(),
        senha: novaSenha,
        role: novoRole,
        oficinaId: Number(novoOficinaId),
      });
      toast.success("Usuário criado com sucesso!");
      setShowForm(false);
      setNovoNome(""); setNovoEmail(""); setNovaSenha(""); setNovoRole("MECANICO"); setNovoOficinaId("");
      carregarDados();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao criar usuário.");
    } finally {
      setSavingUsuario(false);
    }
  }

  // ─── Usuário: editar ─────────────────────────────────────────────────────────
  function startEdit(u: Usuario) {
    setEditId(u.id); setEditNome(u.nome); setEditRole(u.role);
    setResetId(null);
  }

  async function saveEdit(id: number) {
    try {
      await api.patch(`/usuarios/${id}`, { nome: editNome, role: editRole });
      toast.success("Usuário atualizado.");
      setEditId(null);
      carregarDados();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao atualizar.");
    }
  }

  // ─── Usuário: ativar/desativar ───────────────────────────────────────────────
  function pedirToggleAtivo(u: Usuario) {
    setConfirmMsg(`${u.ativo ? "Desativar" : "Ativar"} o usuário "${u.nome}"?`);
    setConfirmAction(() => async () => {
      try {
        await api.patch(`/usuarios/${u.id}`, { ativo: !u.ativo });
        toast.success(`Usuário ${u.ativo ? "desativado" : "ativado"}.`);
        carregarDados();
      } catch {
        toast.error("Erro ao atualizar status.");
      }
    });
    setConfirmOpen(true);
  }

  // ─── Usuário: reset de senha ─────────────────────────────────────────────────
  async function handleResetSenha(id: number) {
    if (!novaSenhaReset.trim()) { toast.error("Digite a nova senha."); return; }
    try {
      await api.post(`/usuarios/${id}/reset-senha`, { novaSenha: novaSenhaReset });
      toast.success("Senha redefinida com sucesso!");
      setResetId(null); setNovaSenhaReset("");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao redefinir senha.");
    }
  }

  // ─── Filtro ───────────────────────────────────────────────────────────────────
  const usuariosFiltrados = filtroOficinaId === "todos"
    ? usuarios
    : usuarios.filter((u) => u.oficinaId === Number(filtroOficinaId));

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Usuários — Todas as Oficinas</h2>
        <button className="btn btnPrimary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Novo usuário"}
        </button>
      </div>

      {/* Formulário novo usuário */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>Novo Usuário</h3>
          <form onSubmit={handleCriarUsuario}>
            <div className="form-row">
              <label className="form-label field-wide">
                Nome
                <input className="input" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome completo" />
              </label>
              <label className="form-label field-wide">
                E-mail
                <input className="input" type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="email@exemplo.com" />
              </label>
              <label className="form-label field-medium">
                Senha inicial
                <input className="input" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </label>
              <label className="form-label field-compact">
                Cargo
                <select className="select" value={novoRole} onChange={(e) => setNovoRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label className="form-label field-wide">
                Oficina
                <select className="select" value={novoOficinaId} onChange={(e) => setNovoOficinaId(e.target.value)}>
                  <option value="">Selecione a oficina...</option>
                  {oficinas.map((o) => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="action-group" style={{ marginTop: 8 }}>
              <button type="submit" className="btn btnPrimary" disabled={savingUsuario}>
                {savingUsuario ? "Salvando..." : "Criar usuário"}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtro por oficina */}
      <div className="status-filter-bar" style={{ marginBottom: 16 }}>
        <button
          className={`status-filter-btn${filtroOficinaId === "todos" ? " active" : ""}`}
          onClick={() => setFiltroOficinaId("todos")}
        >
          Todas ({usuarios.length})
        </button>
        {oficinas.map((o) => {
          const count = usuarios.filter((u) => u.oficinaId === o.id).length;
          return (
            <button
              key={o.id}
              className={`status-filter-btn${filtroOficinaId === String(o.id) ? " active" : ""}`}
              onClick={() => setFiltroOficinaId(String(o.id))}
            >
              {o.nome} ({count})
            </button>
          );
        })}
      </div>

      {/* Tabela de usuários */}
      <div className="card">
        {loading ? (
          <div className="sub">Carregando...</div>
        ) : (
          <div className="table-scroll">
            <table className="table table-min-lg table-cards">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Cargo</th>
                  <th>Oficina</th>
                  <th>Status</th>
                  <th style={{ width: 290 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr className="row-empty">
                    <td colSpan={6} style={{ padding: 12, opacity: 0.7 }}>Nenhum usuário encontrado.</td>
                  </tr>
                ) : usuariosFiltrados.map((u) => (
                  <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.5 }}>
                    <td data-label="Nome">
                      {editId === u.id
                        ? <input className="input" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                        : u.nome}
                    </td>
                    <td data-label="E-mail">{u.email}</td>
                    <td data-label="Cargo">
                      {editId === u.id
                        ? <select className="select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        : <span className="badge">{u.role}</span>}
                    </td>
                    <td data-label="Oficina">
                      <span className="badge">{u.oficina?.nome ?? (u.oficinaId ? `#${u.oficinaId}` : "—")}</span>
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${u.ativo ? "badge-green" : "badge-red"}`}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      {editId === u.id ? (
                        <div className="action-group">
                          <button className="btn btnPrimary" onClick={() => saveEdit(u.id)}>Salvar</button>
                          <button className="btn" onClick={() => setEditId(null)}>Cancelar</button>
                        </div>
                      ) : resetId === u.id ? (
                        <div className="action-group">
                          <input
                            className="input"
                            type="password"
                            placeholder="Nova senha"
                            value={novaSenhaReset}
                            onChange={(e) => setNovaSenhaReset(e.target.value)}
                            style={{ maxWidth: 140 }}
                          />
                          <button className="btn btnPrimary" onClick={() => handleResetSenha(u.id)}>Confirmar</button>
                          <button className="btn" onClick={() => setResetId(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="action-group">
                          <button className="btn btnBlue" onClick={() => startEdit(u)}>Editar</button>
                          <button className="btn" onClick={() => { setResetId(u.id); setEditId(null); }}>Senha</button>
                          <button
                            className={`btn ${u.ativo ? "btnRed" : "btnPrimary"}`}
                            onClick={() => pedirToggleAtivo(u)}
                          >
                            {u.ativo ? "Desativar" : "Ativar"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        message={confirmMsg}
        onConfirm={() => { confirmAction(); setConfirmOpen(false); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
