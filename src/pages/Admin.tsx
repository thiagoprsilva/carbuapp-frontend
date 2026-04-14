import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const API_URL = import.meta.env.VITE_API_URL ?? "";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  oficinaId: number | null;
};

const ROLES = ["ADMIN", "MECANICO"];

export default function Admin() {
  const { user, oficinaAtiva, refreshOficina, isSuperAdmin, selectedOficina } = useAuth();

  // oficinaId: usa selectedOficina para superadmin, user.oficinaId para admin normal
  const oficinaId = isSuperAdmin
    ? (selectedOficina?.id ?? null)
    : (user?.oficinaId ?? null);

  // ─── Todos os hooks primeiro (Rules of Hooks) ────────────────────────────────
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoRole, setNovoRole] = useState("MECANICO");
  const [savingUsuario, setSavingUsuario] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editRole, setEditRole] = useState("");
  const [resetId, setResetId] = useState<number | null>(null);
  const [novaSenhaReset, setNovaSenhaReset] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  // Inicialização correta: (() => () => {}) retorna função vazia como estado inicial
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const logoUrl = oficinaAtiva?.logoUrl
    ? `${API_URL}/uploads/${oficinaAtiva.logoUrl}?t=${Date.now()}`
    : null;

  async function carregarUsuarios() {
    try {
      setLoadingUsuarios(true);
      // Filtra pela oficina atual — evita receber todos os usuários do sistema
      const url = oficinaId ? `/usuarios?oficinaId=${oficinaId}` : "/usuarios";
      const { data } = await api.get<any[]>(url);
      // Remove superadmins da lista (não devem aparecer no painel de admin)
      setUsuarios((data as any[]).filter((u: any) => u.role !== "SUPERADMIN"));
    } catch {
      toast.error("Erro ao carregar usuários.");
    } finally {
      setLoadingUsuarios(false);
    }
  }

  useEffect(() => { carregarUsuarios(); }, []);

  // ─── Guard: superadmin sem oficina selecionada vai para o painel global ───────
  // (após os hooks, conforme Rules of Hooks)
  if (isSuperAdmin && !selectedOficina) {
    return <Navigate to="/superadmin" replace />;
  }

  // ─── Logo: upload ────────────────────────────────────────────────────────────
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !oficinaId) return;

    const form = new FormData();
    form.append("logo", file);

    try {
      setUploadingLogo(true);
      const { data } = await api.post(`/oficinas/${oficinaId}/logo`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Logo atualizado com sucesso!");
      if (oficinaAtiva) {
        refreshOficina({ ...oficinaAtiva, logoUrl: data.logoUrl });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao enviar logo.");
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoverLogo() {
    if (!oficinaId) return;
    try {
      await api.delete(`/oficinas/${oficinaId}/logo`);
      toast.success("Logo removido.");
      if (oficinaAtiva) refreshOficina({ ...oficinaAtiva, logoUrl: null });
    } catch {
      toast.error("Erro ao remover logo.");
    }
  }

  // ─── Usuário: criar ──────────────────────────────────────────────────────────
  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim()) {
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
        ...(isSuperAdmin && { oficinaId }),
      });
      toast.success("Usuário criado com sucesso!");
      setShowForm(false);
      setNovoNome(""); setNovoEmail(""); setNovaSenha(""); setNovoRole("MECANICO");
      carregarUsuarios();
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
      carregarUsuarios();
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
        carregarUsuarios();
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

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Administração</h2>
        {oficinaAtiva && <span className="badge">{oficinaAtiva.nome}</span>}
      </div>

      {/* ── Logo da Oficina ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px" }}>Logo da Oficina</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div className="logo-preview">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo atual" className="logo-preview-img" />
            ) : (
              <div className="logo-preview-empty">Sem logo</div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p className="sub" style={{ margin: 0 }}>
              Formatos: JPG, PNG ou WebP. Tamanho máximo: 2MB.<br />
              Aparece na sidebar e no cabeçalho dos PDFs.
            </p>
            <div className="action-group">
              <button
                className="btn btnPrimary"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? "Enviando..." : logoUrl ? "Trocar logo" : "Enviar logo"}
              </button>
              {logoUrl && (
                <button className="btn btnRed" onClick={handleRemoverLogo}>
                  Remover
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              style={{ display: "none" }}
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </div>

      {/* ── Usuários ────────────────────────────────────────────────────────── */}
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
                {savingUsuario ? "Salvando..." : "Criar usuário"}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        )}

        {loadingUsuarios ? (
          <div className="sub">Carregando...</div>
        ) : (
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
                          <input className="input" type="password" placeholder="Nova senha" value={novaSenhaReset} onChange={(e) => setNovaSenhaReset(e.target.value)} style={{ maxWidth: 140 }} />
                          <button className="btn btnPrimary" onClick={() => handleResetSenha(u.id)}>Confirmar</button>
                          <button className="btn" onClick={() => setResetId(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="action-group">
                          <button className="btn btnBlue" onClick={() => startEdit(u)}>Editar</button>
                          <button className="btn" onClick={() => { setResetId(u.id); setEditId(null); }}>Senha</button>
                          <button className={`btn ${u.ativo ? "btnRed" : "btnPrimary"}`} onClick={() => pedirToggleAtivo(u)}>
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
