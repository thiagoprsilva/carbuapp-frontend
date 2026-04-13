import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

type Oficina = {
  id: number;
  nome: string;
  responsavel: string;
  telefone: string;
  endereco: string;
  logoUrl?: string | null;
};

type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
};

const ROLES = ["ADMIN", "MECANICO"];

export default function SuperadminOficina() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enterOficina } = useAuth();

  const [oficina, setOficina] = useState<Oficina | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Edição da oficina
  const [editNome, setEditNome] = useState("");
  const [editResponsavel, setEditResponsavel] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [savingOficina, setSavingOficina] = useState(false);

  // Novo usuário
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoRole, setNovoRole] = useState("MECANICO");
  const [savingUsuario, setSavingUsuario] = useState(false);

  // Edição inline de usuário
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editUserNome, setEditUserNome] = useState("");
  const [editUserRole, setEditUserRole] = useState("");

  // Reset de senha
  const [resetId, setResetId] = useState<number | null>(null);
  const [novaSenhaReset, setNovaSenhaReset] = useState("");

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  async function carregar() {
    try {
      setLoading(true);
      const [ofRes, usRes] = await Promise.all([
        api.get<Oficina>(`/oficinas/${id}`),
        api.get<Usuario[]>(`/usuarios?oficinaId=${id}`),
      ]);
      setOficina(ofRes.data);
      setEditNome(ofRes.data.nome);
      setEditResponsavel(ofRes.data.responsavel);
      setEditTelefone(ofRes.data.telefone);
      setEditEndereco(ofRes.data.endereco);
      setUsuarios(usRes.data);
    } catch {
      toast.error("Erro ao carregar dados.");
      navigate("/superadmin");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [id]);

  // ─── Salvar dados da oficina ─────────────────────────────────────────────────
  async function handleSalvarOficina(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingOficina(true);
      await api.patch(`/oficinas/${id}`, {
        nome: editNome, responsavel: editResponsavel,
        telefone: editTelefone, endereco: editEndereco,
      });
      toast.success("Dados da oficina atualizados!");
      carregar();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao salvar.");
    } finally {
      setSavingOficina(false);
    }
  }

  // ─── Criar usuário ───────────────────────────────────────────────────────────
  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingUsuario(true);
      await api.post("/usuarios", {
        nome: novoNome, email: novoEmail, senha: novaSenha,
        role: novoRole, oficinaId: Number(id),
      });
      toast.success("Usuário criado!");
      setShowForm(false);
      setNovoNome(""); setNovoEmail(""); setNovaSenha(""); setNovoRole("MECANICO");
      carregar();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao criar usuário.");
    } finally {
      setSavingUsuario(false);
    }
  }

  // ─── Editar usuário ──────────────────────────────────────────────────────────
  async function saveEditUser(userId: number) {
    try {
      await api.patch(`/usuarios/${userId}`, { nome: editUserNome, role: editUserRole });
      toast.success("Usuário atualizado.");
      setEditUserId(null);
      carregar();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao atualizar.");
    }
  }

  // ─── Toggle ativo ────────────────────────────────────────────────────────────
  function pedirToggle(u: Usuario) {
    setConfirmMsg(`${u.ativo ? "Desativar" : "Ativar"} o usuário "${u.nome}"?`);
    setConfirmAction(() => async () => {
      try {
        await api.patch(`/usuarios/${u.id}`, { ativo: !u.ativo });
        toast.success(`Usuário ${u.ativo ? "desativado" : "ativado"}.`);
        carregar();
      } catch { toast.error("Erro ao atualizar status."); }
    });
    setConfirmOpen(true);
  }

  // ─── Reset senha ─────────────────────────────────────────────────────────────
  async function handleResetSenha(userId: number) {
    if (!novaSenhaReset.trim()) { toast.error("Digite a nova senha."); return; }
    try {
      await api.post(`/usuarios/${userId}/reset-senha`, { novaSenha: novaSenhaReset });
      toast.success("Senha redefinida!");
      setResetId(null); setNovaSenhaReset("");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao redefinir senha.");
    }
  }

  if (loading) return <div className="container"><div className="card">Carregando...</div></div>;
  if (!oficina) return null;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <button className="btn" style={{ marginBottom: 8 }} onClick={() => navigate("/superadmin")}>
            ← Voltar
          </button>
          <h2 className="page-title">{oficina.nome}</h2>
        </div>
        <button
          className="btn btnPrimary"
          onClick={() => {
            enterOficina(oficina);
            navigate("/");
          }}
        >
          Acessar como Admin
        </button>
      </div>

      {/* ── Dados da oficina ──────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px" }}>Dados da Oficina</h3>
        <form onSubmit={handleSalvarOficina}>
          <div className="form-row">
            <label className="form-label field-wide">
              Nome
              <input className="input" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </label>
            <label className="form-label field-wide">
              Responsável
              <input className="input" value={editResponsavel} onChange={(e) => setEditResponsavel(e.target.value)} />
            </label>
            <label className="form-label field-medium">
              Telefone
              <input className="input" value={editTelefone} onChange={(e) => setEditTelefone(e.target.value)} />
            </label>
            <label className="form-label field-grow">
              Endereço
              <input className="input" value={editEndereco} onChange={(e) => setEditEndereco(e.target.value)} />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btnPrimary" disabled={savingOficina}>
              {savingOficina ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Usuários ─────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Usuários</h3>
          <button className="btn btnPrimary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "+ Novo usuário"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCriarUsuario} className="card" style={{ marginBottom: 16, background: "var(--bg)" }}>
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
            </div>
            <div className="action-group" style={{ marginTop: 8 }}>
              <button type="submit" className="btn btnPrimary" disabled={savingUsuario}>
                {savingUsuario ? "Salvando..." : "Criar"}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        )}

        <div className="table-scroll">
          <table className="table table-min-lg table-cards">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Status</th>
                <th style={{ width: 280 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr className="row-empty">
                  <td colSpan={5} style={{ padding: 12, opacity: 0.7 }}>Nenhum usuário cadastrado.</td>
                </tr>
              ) : usuarios.map((u) => (
                <tr key={u.id} style={{ opacity: u.ativo ? 1 : 0.5 }}>
                  <td data-label="Nome">
                    {editUserId === u.id
                      ? <input className="input" value={editUserNome} onChange={(e) => setEditUserNome(e.target.value)} />
                      : u.nome}
                  </td>
                  <td data-label="E-mail">{u.email}</td>
                  <td data-label="Cargo">
                    {editUserId === u.id
                      ? <select className="select" value={editUserRole} onChange={(e) => setEditUserRole(e.target.value)}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      : <span className="badge">{u.role}</span>}
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${u.ativo ? "badge-green" : "badge-red"}`}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    {editUserId === u.id ? (
                      <div className="action-group">
                        <button className="btn btnPrimary" onClick={() => saveEditUser(u.id)}>Salvar</button>
                        <button className="btn" onClick={() => setEditUserId(null)}>Cancelar</button>
                      </div>
                    ) : resetId === u.id ? (
                      <div className="action-group">
                        <input className="input" type="password" placeholder="Nova senha" value={novaSenhaReset} onChange={(e) => setNovaSenhaReset(e.target.value)} style={{ maxWidth: 140 }} />
                        <button className="btn btnPrimary" onClick={() => handleResetSenha(u.id)}>Confirmar</button>
                        <button className="btn" onClick={() => setResetId(null)}>Cancelar</button>
                      </div>
                    ) : (
                      <div className="action-group">
                        <button className="btn btnBlue" onClick={() => { setEditUserId(u.id); setEditUserNome(u.nome); setEditUserRole(u.role); setResetId(null); }}>Editar</button>
                        <button className="btn" onClick={() => { setResetId(u.id); setEditUserId(null); }}>Senha</button>
                        <button className={`btn ${u.ativo ? "btnRed" : "btnPrimary"}`} onClick={() => pedirToggle(u)}>
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
