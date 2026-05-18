import { useEffect } from "react";

const STYLE_ID = "sk-pulse-keyframes";

function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `@keyframes sk-pulse { 0%,100%{opacity:.35} 50%{opacity:.75} }`;
  document.head.appendChild(style);
}

// ─── SkeletonLine ──────────────────────────────────────────────────────────────

type SkeletonLineProps = {
  width?: string | number;
  height?: string | number;
};

export function SkeletonLine({ width = "100%", height = 14 }: SkeletonLineProps) {
  useEffect(() => { injectKeyframes(); }, []);

  return (
    <div
      style={{
        width,
        height,
        background: "var(--surface2)",
        borderRadius: 6,
        animation: "sk-pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

// ─── SkeletonCard ──────────────────────────────────────────────────────────────

type SkeletonCardProps = {
  lines?: number;
};

export function SkeletonCard({ lines = 4 }: SkeletonCardProps) {
  useEffect(() => { injectKeyframes(); }, []);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? "60%" : i % 2 === 0 ? "85%" : "75%"} />
      ))}
    </div>
  );
}

// ─── SkeletonTable ─────────────────────────────────────────────────────────────

type SkeletonTableProps = {
  rows?: number;
  cols?: number;
};

export function SkeletonTable({ rows = 5, cols = 4 }: SkeletonTableProps) {
  useEffect(() => { injectKeyframes(); }, []);

  return (
    <div className="card">
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, c) => (
                <th key={c}>
                  <SkeletonLine height={12} width="70%" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <SkeletonLine height={13} width={c === 0 ? "50%" : c % 2 === 0 ? "80%" : "65%"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
