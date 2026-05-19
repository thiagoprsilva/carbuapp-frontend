import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL ?? "";

type Oficina = {
  id: number;
  nome: string;
  responsavel: string;
  telefone: string;
  endereco: string;
  logoUrl?: string | null;
  _count?: { usuarios: number; clientes: number };
};

export default function Superadmin() {
  const navigate = useNavigate();
  const { enterOficina } = useAuth();

  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário nova oficina
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [saving, setSaving] = useState(false);

  async function carregarOficinas() {
    try {
      setLoading(true);
      const { data } = await api.get<Oficina[]>("/oficinas");
      setOficinas(data);
    } catch {
      toast.error("Erro ao carregar oficinas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarOficinas(); }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !responsavel.trim() || !telefone.trim() || !endereco.trim()) {
      toast.error("Preencha todos os campos."); return;
    }
    try {
      setSaving(true);
      await api.post("/oficinas", { nome, responsavel, telefone, endereco });
      toast.success("Oficina criada com sucesso!");
      setShowForm(false);
      setNome(""); setResponsavel(""); setTelefone(""); setEndereco("");
      carregarOficinas();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Erro ao criar oficina.");
    } finally {
      setSaving(false);
    }
  }

  function handleEntrar(o: Oficina) {
    enterOficina({ id: o.id, nome: o.nome, responsavel: o.responsavel, logoUrl: o.logoUrl });
    navigate("/app");
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2 className="page-title">Painel Global — Oficinas</h2>
        <button className="btn btnPrimary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Nova Oficina"}
        </button>
      </div>

      {/* Formulário nova oficina */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>Nova Oficina</h3>
          <form onSubmit={handleCriar}>
            <div className="form-row">
              <label className="form-label field-wide">
                Nome da Oficina
                <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Auto Peças Silva" />
              </label>
              <label className="form-label field-wide">
                Responsável
                <input className="input" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome do responsável" />
              </label>
              <label className="form-label field-medium">
                Telefone
                <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 9 0000-0000" />
              </label>
              <label className="form-label field-grow">
                Endereço
                <input className="input" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, cidade" />
              </label>
            </div>
            <div className="action-group" style={{ marginTop: 12 }}>
              <button type="submit" className="btn btnPrimary" disabled={saving}>
                {saving ? "Salvando..." : "Criar Oficina"}
              </button>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de oficinas */}
      {loading ? (
        <div className="card">Carregando...</div>
      ) : oficinas.length === 0 ? (
        <div className="card sub">Nenhuma oficina cadastrada.</div>
      ) : (
        <div className="oficinas-grid">
          {oficinas.map((o) => (
            <div key={o.id} className="card oficina-card">
              <div className="oficina-card-header">
                {o.logoUrl ? (
                  <img
                    src={`${API_URL}/uploads/${o.logoUrl}`}
                    alt="Logo"
                    className="oficina-card-logo"
                  />
                ) : (
                  <div className="oficina-card-logo-placeholder">
                    {o.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="oficina-card-nome">{o.nome}</div>
                  <div className="sub">{o.responsavel}</div>
                </div>
              </div>

              <div className="oficina-card-info">
                <span>📞 {o.telefone}</span>
                <span>📍 {o.endereco}</span>
              </div>

              <div className="oficina-card-stats">
                <span className="badge">{o._count?.usuarios ?? 0} usuário(s)</span>
                <span className="badge">{o._count?.clientes ?? 0} cliente(s)</span>
              </div>

              <div className="action-group" style={{ marginTop: 12 }}>
                <button className="btn btnPrimary" onClick={() => handleEntrar(o)}>
                  Acessar
                </button>
                <button className="btn btnBlue" onClick={() => navigate(`/superadmin/oficinas/${o.id}`)}>
                  Gerenciar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
