import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../services/api";

type KnownSearchType = "CLIENTE" | "VEICULO" | "ORCAMENTO" | "REGISTRO";
type SearchType = KnownSearchType | string;

type SearchItem = {
  type: SearchType;
  title: string;
  subtitle?: string | null;
  href: string;
};

type SearchResponse = {
  q: string;
  results: SearchItem[];
};

const TYPE_LABELS: Record<KnownSearchType, string> = {
  CLIENTE: "Clientes",
  VEICULO: "Veículos",
  ORCAMENTO: "Orçamentos",
  REGISTRO: "Registros",
};

const TYPE_ORDER: KnownSearchType[] = [
  "CLIENTE",
  "VEICULO",
  "ORCAMENTO",
  "REGISTRO",
];

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setHighlightIndex(-1);
      return;
    }

    setLoading(true);
    setError(null);

    const handle = setTimeout(async () => {
      try {
        const baseURL = api.defaults.baseURL ?? "";
        const normalized = baseURL.endsWith("/")
          ? baseURL.slice(0, -1)
          : baseURL;
        const hasApiSuffix = normalized.endsWith("/api");

        const path = hasApiSuffix ? "/search" : "/api/search";

        const response = await api.get<SearchResponse>(path, {
          params: { q: query.trim() },
        });

        if (import.meta.env.DEV) {
          // Logs úteis em modo dev para diagnosticar problemas de proxy/backend
          console.log("[GlobalSearch] status:", response.status);
          console.log(
            "[GlobalSearch] content-type:",
            response.headers["content-type"] ?? response.headers["Content-Type"],
          );
        }

        const data = response.data;
        const nextResults = Array.isArray(data.results) ? data.results : [];

        setResults(nextResults);
        setHighlightIndex(nextResults.length > 0 ? 0 : -1);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const { config, response } = err;

          if (import.meta.env.DEV) {
            const safeHeaders: Record<string, unknown> = {};

            if (config?.headers && typeof config.headers === "object") {
              for (const [key, value] of Object.entries(config.headers)) {
                if (key.toLowerCase() === "authorization") {
                  safeHeaders[key] =
                    typeof value === "string"
                      ? `${value.slice(0, 16)}...(masked)`
                      : "(masked)";
                } else {
                  safeHeaders[key] = value;
                }
              }
            }

            console.error("[GlobalSearch] axios error message:", err.message);
            console.error("[GlobalSearch] request baseURL:", config?.baseURL);
            console.error("[GlobalSearch] request url:", config?.url);
            console.error("[GlobalSearch] request headers (safe):", safeHeaders);

            if (response) {
              const { status, headers, data } = response;
              console.error("[GlobalSearch] response status:", status);
              console.error(
                "[GlobalSearch] response content-type:",
                headers["content-type"] ?? headers["Content-Type"],
              );

              if (typeof data === "string") {
                console.error(
                  "[GlobalSearch] response body snippet:",
                  data.slice(0, 500),
                );
              } else {
                console.error("[GlobalSearch] response body (json):", data);
              }
            }
          }

          if (response) {
            const status = response.status;
            setError(`Erro ${status} ao buscar resultados.`);
          } else if (err.message) {
            setError(`Erro ao buscar resultados: ${err.message}`);
          } else {
            setError("Erro ao buscar resultados.");
          }
        } else if ((err as DOMException).name === "AbortError") {
          // ignorar cancelamentos de debounce
          return;
        } else {
          const message =
            err instanceof Error && err.message
              ? err.message
              : "Erro ao buscar resultados.";
          setError(message);
        }

        setResults([]);
        setHighlightIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(handle);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setHighlightIndex((prev) => {
        const next = prev + 1;
        return next >= results.length ? 0 : next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setHighlightIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? results.length - 1 : next;
      });
    } else if (e.key === "Enter") {
      if (!open || results.length === 0 || highlightIndex < 0) return;
      e.preventDefault();
      const selected = results[highlightIndex];
      if (!selected) return;
      openResult(selected);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  function openResult(item: SearchItem) {
    navigate(item.href);
    setOpen(false);
  }

  function handleItemClick(item: SearchItem) {
    openResult(item);
  }

  const hasAnyResult = results.length > 0;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", maxWidth: 420 }}
    >
      <input
        type="search"
        className="input"
        placeholder="Buscar em clientes, veículos, orçamentos, registros..."
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);

          if (value.trim().length >= 2) {
            setOpen(true);
          } else {
            setOpen(false);
            setResults([]);
            setHighlightIndex(-1);
          }
        }}
        onKeyDown={handleKeyDown}
        aria-label="Busca global"
      />

      {open && query.trim().length >= 2 && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 20,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {loading && (
            <div style={{ padding: 8, fontSize: 14, opacity: 0.8 }}>
              Carregando...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: 8, fontSize: 14, color: "#b91c1c" }}>
              {error}
            </div>
          )}

          {!loading && !error && !hasAnyResult && query.trim().length >= 2 && (
            <div style={{ padding: 8, fontSize: 14, opacity: 0.8 }}>
              Nenhum resultado encontrado.
            </div>
          )}

          {!loading && !error && hasAnyResult && (
            <div>
              {TYPE_ORDER.map((type) => {
                const items = results.filter((item) => item.type === type);
                if (items.length === 0) return null;

                return (
                  <div key={type}>
                    <div
                      style={{
                        padding: "6px 8px",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.06,
                        opacity: 0.6,
                      }}
                    >
                      {TYPE_LABELS[type]}
                    </div>

                    {items.map((item) => {
                      const index = results.findIndex(
                        (r) => r.type === item.type && r.href === item.href,
                      );
                      const isActive = index === highlightIndex;

                      return (
                        <button
                          key={`${item.type}-${item.href}`}
                          type="button"
                          onClick={() => handleItemClick(item)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "6px 8px",
                            border: "none",
                            backgroundColor: isActive ? "#e5e7eb" : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              marginBottom: item.subtitle ? 2 : 0,
                            }}
                          >
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div
                              style={{
                                fontSize: 12,
                                opacity: 0.75,
                              }}
                            >
                              {item.subtitle}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

