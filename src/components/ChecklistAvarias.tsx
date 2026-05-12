import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AvariaZona =
  | "pc_d" | "capo" | "plde" | "pldd"
  | "ret_e" | "ret_d"
  | "pde" | "pdd" | "pte" | "ptd" | "teto"
  | "plte" | "pltd" | "pm" | "pc_t";

export type Severidade = "leve" | "moderado" | "grave";

export type AvariaItem = {
  zona: AvariaZona;
  severidade: Severidade;
  observacao?: string;
};

export type AvariaMap = Partial<Record<AvariaZona, AvariaItem>>;

// ─── Metadados das zonas ──────────────────────────────────────────────────────

const ZONA_LABELS: Record<AvariaZona, string> = {
  pc_d:  "Para-choque dianteiro",
  capo:  "Capô",
  plde:  "Para-lama diant. esq.",
  pldd:  "Para-lama diant. dir.",
  ret_e: "Retrovisor esq.",
  ret_d: "Retrovisor dir.",
  pde:   "Porta diant. esq.",
  pdd:   "Porta diant. dir.",
  pte:   "Porta tras. esq.",
  ptd:   "Porta tras. dir.",
  teto:  "Teto",
  plte:  "Para-lama tras. esq.",
  pltd:  "Para-lama tras. dir.",
  pm:    "Porta-malas",
  pc_t:  "Para-choque traseiro",
};

const SEV_SEQUENCE: (Severidade | null)[] = ["leve", "moderado", "grave", null];

const SEV_COLOR: Record<Severidade, string> = {
  leve:     "rgba(250,204,21,0.55)",
  moderado: "rgba(249,115,22,0.65)",
  grave:    "rgba(239,68,68,0.75)",
};

const SEV_LABEL: Record<Severidade, string> = {
  leve:     "Leve",
  moderado: "Moderado",
  grave:    "Grave",
};

// ─── Definição dos retângulos SVG ─────────────────────────────────────────────
// viewBox: "0 0 220 400" — frente do carro no topo

type ZonaRect = { zona: AvariaZona; x: number; y: number; w: number; h: number; rx?: number };

const ZONAS: ZonaRect[] = [
  // Para-choque dianteiro
  { zona: "pc_d",  x: 32,  y: 5,   w: 156, h: 35,  rx: 10 },
  // Para-lama diant. esq. / dir.
  { zona: "plde",  x: 20,  y: 40,  w: 35,  h: 78 },
  { zona: "pldd",  x: 165, y: 40,  w: 35,  h: 78 },
  // Capô
  { zona: "capo",  x: 55,  y: 40,  w: 110, h: 78 },
  // Retrovisores
  { zona: "ret_e", x: 4,   y: 118, w: 18,  h: 32,  rx: 4 },
  { zona: "ret_d", x: 198, y: 118, w: 18,  h: 32,  rx: 4 },
  // Portas dianteiras
  { zona: "pde",   x: 20,  y: 118, w: 35,  h: 75 },
  { zona: "pdd",   x: 165, y: 118, w: 35,  h: 75 },
  // Teto (cobre área central)
  { zona: "teto",  x: 55,  y: 118, w: 110, h: 164 },
  // Portas traseiras
  { zona: "pte",   x: 20,  y: 193, w: 35,  h: 89 },
  { zona: "ptd",   x: 165, y: 193, w: 35,  h: 89 },
  // Para-lama tras. esq. / dir.
  { zona: "plte",  x: 20,  y: 282, w: 35,  h: 75 },
  { zona: "pltd",  x: 165, y: 282, w: 35,  h: 75 },
  // Porta-malas
  { zona: "pm",    x: 55,  y: 282, w: 110, h: 75 },
  // Para-choque traseiro
  { zona: "pc_t",  x: 32,  y: 357, w: 156, h: 33,  rx: 10 },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  avarias: AvariaMap;
  onChange?: (avarias: AvariaMap) => void;
  readonly?: boolean;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ChecklistAvarias({ avarias, onChange, readonly = false }: Props) {
  const [zonaAtiva, setZonaAtiva] = useState<AvariaZona | null>(null);

  function handleClickZona(zona: AvariaZona) {
    if (readonly) { setZonaAtiva((v) => (v === zona ? null : zona)); return; }

    const atual = avarias[zona]?.severidade ?? null;
    const idx = SEV_SEQUENCE.indexOf(atual);
    const prox = SEV_SEQUENCE[(idx + 1) % SEV_SEQUENCE.length];

    const next: AvariaMap = { ...avarias };
    if (prox === null) {
      delete next[zona];
    } else {
      next[zona] = { zona, severidade: prox, observacao: avarias[zona]?.observacao };
    }

    setZonaAtiva(prox !== null ? zona : null);
    onChange?.(next);
  }

  function handleObservacao(zona: AvariaZona, obs: string) {
    if (readonly || !avarias[zona]) return;
    onChange?.({ ...avarias, [zona]: { ...avarias[zona]!, observacao: obs } });
  }

  const zonaAtivaData = zonaAtiva ? avarias[zonaAtiva] : null;
  const totalAvarias = Object.keys(avarias).length;

  return (
    <div className="checklist-wrap">
      {/* Diagrama SVG */}
      <div className="checklist-svg-wrap">
        {!readonly && (
          <div className="checklist-hint">
            Clique em uma zona para marcar avaria · clique de novo para mudar severidade · 3× para limpar
          </div>
        )}

        <svg
          viewBox="0 0 220 400"
          xmlns="http://www.w3.org/2000/svg"
          className="checklist-svg"
          aria-label="Diagrama do veículo"
        >
          {/* Silhueta de fundo */}
          <rect x="20" y="5" width="180" height="385" rx="14" fill="#1a1a24" stroke="#2a2a38" strokeWidth="1.5" />

          {/* Zonas */}
          {ZONAS.map(({ zona, x, y, w, h, rx = 3 }) => {
            const avaria = avarias[zona];
            const fill = avaria ? SEV_COLOR[avaria.severidade] : "rgba(255,255,255,0.03)";
            const stroke = avaria
              ? avaria.severidade === "grave" ? "#ef4444"
              : avaria.severidade === "moderado" ? "#f97316"
              : "#fbbf24"
              : zonaAtiva === zona ? "rgba(249,115,22,0.5)" : "#2a2a38";
            const strokeW = avaria || zonaAtiva === zona ? 1.5 : 1;

            return (
              <rect
                key={zona}
                x={x} y={y} width={w} height={h} rx={rx}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeW}
                style={{ cursor: readonly ? "default" : "pointer", transition: "fill .15s, stroke .15s" }}
                onClick={() => handleClickZona(zona)}
              >
                <title>{ZONA_LABELS[zona]}{avaria ? ` — ${SEV_LABEL[avaria.severidade]}` : ""}</title>
              </rect>
            );
          })}

          {/* Labels das zonas com avaria */}
          {ZONAS.map(({ zona, x, y, w, h }) => {
            const avaria = avarias[zona];
            if (!avaria) return null;
            return (
              <text
                key={`lbl-${zona}`}
                x={x + w / 2}
                y={y + h / 2 + 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#fff"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {SEV_LABEL[avaria.severidade][0].toUpperCase()}
              </text>
            );
          })}

          {/* Indicadores de direção */}
          <text x="110" y="396" textAnchor="middle" fontSize="9" fill="#4a4a60">▼ TRASEIRA</text>
          <text x="110" y="2"  textAnchor="middle" fontSize="9" fill="#4a4a60" dominantBaseline="hanging">DIANTEIRA ▲</text>
        </svg>
      </div>

      {/* Painel lateral */}
      <div className="checklist-panel">
        {/* Legenda de severidade */}
        <div className="checklist-legenda">
          <div className="checklist-legenda-title">Severidade</div>
          {(Object.entries(SEV_COLOR) as [Severidade, string][]).map(([sev, cor]) => (
            <div key={sev} className="checklist-legenda-item">
              <span className="checklist-legenda-dot" style={{ background: cor, border: `1.5px solid ${cor.replace(/[\d.]+\)/, "1)")}` }} />
              <span>{SEV_LABEL[sev]}</span>
            </div>
          ))}
        </div>

        {/* Contador */}
        {totalAvarias > 0 && (
          <div className="checklist-contador">
            <span className="badge">{totalAvarias} zona(s) marcada(s)</span>
          </div>
        )}

        {/* Detalhe da zona ativa */}
        {zonaAtiva && zonaAtivaData && (
          <div className="checklist-zona-detail">
            <div className="checklist-zona-nome">{ZONA_LABELS[zonaAtiva]}</div>
            <div className="checklist-zona-sev" style={{ color: SEV_COLOR[zonaAtivaData.severidade].replace(/[\d.]+\)/, "1)") }}>
              {SEV_LABEL[zonaAtivaData.severidade]}
            </div>
            {!readonly && (
              <textarea
                className="input checklist-obs"
                placeholder="Observação (opcional)"
                value={zonaAtivaData.observacao ?? ""}
                onChange={(e) => handleObservacao(zonaAtiva, e.target.value)}
                rows={3}
              />
            )}
            {readonly && zonaAtivaData.observacao && (
              <div className="sub" style={{ marginTop: 6 }}>{zonaAtivaData.observacao}</div>
            )}
          </div>
        )}

        {/* Lista de avarias */}
        {totalAvarias > 0 && (
          <div className="checklist-lista">
            <div className="checklist-legenda-title" style={{ marginBottom: 6 }}>Avarias registradas</div>
            {(Object.entries(avarias) as [AvariaZona, AvariaItem][]).map(([zona, item]) => (
              <div
                key={zona}
                className={`checklist-lista-item ${zonaAtiva === zona ? "ativo" : ""}`}
                onClick={() => setZonaAtiva((v) => (v === zona ? null : zona))}
              >
                <span
                  className="checklist-legenda-dot"
                  style={{ background: SEV_COLOR[item.severidade], border: `1.5px solid ${SEV_COLOR[item.severidade].replace(/[\d.]+\)/, "1)")}` }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{ZONA_LABELS[zona]}</div>
                  {item.observacao && <div className="sub" style={{ fontSize: 11 }}>{item.observacao}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalAvarias === 0 && !zonaAtiva && (
          <div className="sub" style={{ fontSize: 13, marginTop: 8 }}>
            {readonly ? "Nenhuma avaria registrada." : "Clique nas zonas do diagrama para registrar avarias."}
          </div>
        )}
      </div>
    </div>
  );
}
