import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function go(path: string) {
    setOpen(false);
    navigate(path);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  return (
    <>
      {/* Overlay para fechar o menu */}
      {open && <div className="fab-overlay" onClick={() => setOpen(false)} />}

      <div className="fab-container">
        {/* Ações rápidas */}
        {open && (
          <div className="fab-actions">
            <button className="fab-action-item" onClick={() => go("/orcamentos")}>
              <span className="fab-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </span>
              <span className="fab-action-label">Novo Orçamento</span>
            </button>

            <button className="fab-action-item" onClick={() => go("/clientes")}>
              <span className="fab-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
              <span className="fab-action-label">Novo Cliente</span>
            </button>
          </div>
        )}

        {/* Botão principal */}
        <button
          className={`fab-btn ${open ? "open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Ações rápidas"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ transition: "transform .2s", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </>
  );
}
