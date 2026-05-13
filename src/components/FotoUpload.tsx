import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL ?? "";

type Foto = {
  id: number;
  url: string;
  descricao?: string | null;
  zona?: string | null;
  criadoEm: string;
};

type Props = {
  registroTecnicoId: number;
  readonly?: boolean;
};

export default function FotoUpload({ registroTecnicoId, readonly = false }: Props) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [ampliada, setAmpliada] = useState<Foto | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadFotos() {
    setLoading(true);
    try {
      const res = await api.get<Foto[]>(`/registroTecnico/${registroTecnicoId}/fotos`);
      setFotos(res.data);
    } catch {
      // silencioso — pode não ter fotos
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFotos();
  }, [registroTecnicoId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Selecione uma imagem."); return; }

    const formData = new FormData();
    formData.append("foto", file);
    if (descricao.trim()) formData.append("descricao", descricao.trim());

    setUploading(true);
    try {
      await api.post(`/registroTecnico/${registroTecnicoId}/fotos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Foto enviada!");
      setDescricao("");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadFotos();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao enviar foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(fotoId: number) {
    try {
      await api.delete(`/registroTecnico/${registroTecnicoId}/fotos/${fotoId}`);
      toast.success("Foto removida.");
      setFotos((prev) => prev.filter((f) => f.id !== fotoId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Erro ao remover foto.");
    }
  }

  return (
    <div className="foto-upload-wrap">
      {/* Form de upload */}
      {!readonly && (
        <form onSubmit={handleUpload} className="foto-upload-form">
          <label className="foto-file-label">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div className="foto-file-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Escolher foto
            </div>
          </label>

          {preview && (
            <img src={preview} alt="Prévia" className="foto-preview-thumb" />
          )}

          <input
            className="input"
            placeholder="Descrição (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            style={{ flex: 1, minWidth: 140 }}
          />

          <button
            type="submit"
            className="btn btnPrimary"
            disabled={uploading || !preview}
          >
            {uploading ? "Enviando..." : "Enviar"}
          </button>
        </form>
      )}

      {/* Grid de fotos */}
      {loading ? (
        <div className="sub">Carregando fotos...</div>
      ) : fotos.length === 0 ? (
        <div className="sub" style={{ padding: "12px 0" }}>
          {readonly ? "Nenhuma foto registrada." : "Nenhuma foto enviada ainda."}
        </div>
      ) : (
        <div className="foto-grid">
          {fotos.map((foto) => (
            <div key={foto.id} className="foto-card">
              <img
                src={`${API_URL}/uploads/${foto.url}`}
                alt={foto.descricao ?? "Foto"}
                className="foto-img"
                onClick={() => setAmpliada(foto)}
              />
              {foto.descricao && (
                <div className="foto-desc">{foto.descricao}</div>
              )}
              {!readonly && (
                <button
                  className="foto-del-btn"
                  type="button"
                  onClick={() => handleDelete(foto.id)}
                  title="Remover foto"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {ampliada && (
        <div className="foto-lightbox" onClick={() => setAmpliada(null)}>
          <img
            src={`${API_URL}/uploads/${ampliada.url}`}
            alt={ampliada.descricao ?? "Foto"}
            className="foto-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          {ampliada.descricao && (
            <div className="foto-lightbox-desc">{ampliada.descricao}</div>
          )}
          <button className="foto-lightbox-close" onClick={() => setAmpliada(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
