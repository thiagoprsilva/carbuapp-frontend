import { Link } from "react-router-dom";

const S = {
  // Layout base
  page: {
    minHeight: "100vh",
    background: "#0a0a0c",
    color: "#f0f0f4",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    overflowX: "hidden" as const,
  },
  // Navbar
  nav: {
    position: "fixed" as const,
    top: 0, left: 0, right: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 40px",
    background: "rgba(10,10,12,.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(249,115,22,.10)",
  },
  navLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  navLogoImg: {
    width: 36,
    height: 36,
    objectFit: "contain" as const,
  },
  navLogoText: {
    fontSize: 20,
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "-.3px",
  },
  navLogoSpan: {
    color: "#f97316",
  },
  navBtn: {
    padding: "9px 22px",
    background: "#f97316",
    color: "#0a0a0c",
    border: "none",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 4px 14px rgba(249,115,22,.35)",
    transition: "all .2s",
  },
  // Hero
  hero: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    padding: "120px 24px 80px",
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(249,115,22,.12)",
    border: "1px solid rgba(249,115,22,.25)",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 700,
    color: "#f97316",
    marginBottom: 28,
    letterSpacing: ".04em",
  },
  heroTitle: {
    fontSize: "clamp(36px, 6vw, 72px)",
    fontWeight: 900,
    lineHeight: 1.05,
    maxWidth: 820,
    margin: "0 auto 24px",
    letterSpacing: "-1.5px",
  },
  heroOrange: {
    color: "#f97316",
    display: "block",
  },
  heroSub: {
    fontSize: "clamp(16px, 2vw, 20px)",
    color: "#8b8d9e",
    maxWidth: 580,
    margin: "0 auto 40px",
    lineHeight: 1.6,
  },
  heroActions: {
    display: "flex",
    gap: 14,
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  btnPrimary: {
    padding: "14px 32px",
    background: "#f97316",
    color: "#0a0a0c",
    border: "none",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 6px 24px rgba(249,115,22,.40)",
  },
  btnSecondary: {
    padding: "14px 32px",
    background: "transparent",
    color: "#f0f0f4",
    border: "1px solid rgba(255,255,255,.15)",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  heroStats: {
    display: "flex",
    gap: 40,
    justifyContent: "center",
    marginTop: 60,
    flexWrap: "wrap" as const,
  },
  heroStat: {
    textAlign: "center" as const,
  },
  heroStatNum: {
    fontSize: 32,
    fontWeight: 900,
    color: "#f97316",
    display: "block",
  },
  heroStatLabel: {
    fontSize: 13,
    color: "#6b6b80",
    fontWeight: 600,
  },
  // Sections
  section: {
    padding: "80px 24px",
    maxWidth: 1100,
    margin: "0 auto",
  },
  sectionCenter: {
    textAlign: "center" as const,
    marginBottom: 52,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    color: "#f97316",
    textTransform: "uppercase" as const,
    letterSpacing: ".12em",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: "clamp(26px, 4vw, 42px)",
    fontWeight: 900,
    lineHeight: 1.15,
    letterSpacing: "-.5px",
    margin: "0 auto 16px",
    maxWidth: 700,
  },
  sectionSub: {
    fontSize: 16,
    color: "#8b8d9e",
    maxWidth: 560,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  // Problem / Solution
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  problemCard: {
    background: "rgba(248,113,113,.06)",
    border: "1px solid rgba(248,113,113,.18)",
    borderRadius: 16,
    padding: 32,
  },
  solutionCard: {
    background: "rgba(249,115,22,.06)",
    border: "1px solid rgba(249,115,22,.18)",
    borderRadius: 16,
    padding: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  cardText: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 1.7,
    marginBottom: 16,
  },
  checkList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  checkItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 14,
    color: "#c8c8d8",
    lineHeight: 1.5,
  },
  checkIcon: {
    color: "#f97316",
    fontWeight: 900,
    flexShrink: 0,
    marginTop: 1,
  },
  // Features grid
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 14,
  },
  featureCard: {
    background: "#111115",
    border: "1px solid #242430",
    borderRadius: 16,
    padding: "24px 20px",
    textAlign: "center" as const,
    transition: "all .2s",
    cursor: "default" as const,
  },
  featureNum: {
    fontSize: 13,
    fontWeight: 800,
    color: "rgba(249,115,22,.5)",
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 12,
    display: "block",
  },
  featureName: {
    fontSize: 13,
    fontWeight: 800,
    color: "#f0f0f4",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: ".06em",
  },
  featureDesc: {
    fontSize: 12,
    color: "#6b6b80",
    lineHeight: 1.6,
  },
  // Personas
  personasGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
  },
  personaCard: {
    background: "#111115",
    border: "1px solid #242430",
    borderRadius: 16,
    padding: 28,
    textAlign: "center" as const,
  },
  personaEmoji: {
    fontSize: 40,
    display: "block",
    marginBottom: 14,
  },
  personaTitle: {
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 8,
    color: "#f0f0f4",
  },
  personaDesc: {
    fontSize: 13,
    color: "#6b6b80",
    lineHeight: 1.6,
  },
  // Clients
  clientsBand: {
    background: "#0d0d12",
    borderTop: "1px solid #1a1a24",
    borderBottom: "1px solid #1a1a24",
    padding: "60px 24px",
  },
  clientsInner: {
    maxWidth: 900,
    margin: "0 auto",
    textAlign: "center" as const,
  },
  clientsLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#4b4b5e",
    textTransform: "uppercase" as const,
    letterSpacing: ".14em",
    marginBottom: 36,
  },
  clientsRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 60,
    flexWrap: "wrap" as const,
  },
  clientName: {
    fontSize: 22,
    fontWeight: 900,
    color: "#3a3a50",
    letterSpacing: "-.5px",
    textTransform: "uppercase" as const,
    transition: "color .2s",
  },
  // Benefits
  benefitsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  benefitRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    background: "#111115",
    border: "1px solid #242430",
    borderRadius: 14,
    padding: "20px 22px",
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "rgba(249,115,22,.12)",
    border: "1px solid rgba(249,115,22,.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 4,
    color: "#f0f0f4",
  },
  benefitDesc: {
    fontSize: 13,
    color: "#6b6b80",
    lineHeight: 1.5,
  },
  // CTA Final
  ctaBand: {
    padding: "100px 24px",
    textAlign: "center" as const,
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  ctaGlow: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    height: 300,
    background: "radial-gradient(ellipse, rgba(249,115,22,.10) 0%, transparent 70%)",
    pointerEvents: "none" as const,
  },
  ctaTitle: {
    fontSize: "clamp(28px, 4vw, 48px)",
    fontWeight: 900,
    marginBottom: 16,
    letterSpacing: "-1px",
    position: "relative" as const,
  },
  ctaSub: {
    fontSize: 17,
    color: "#8b8d9e",
    maxWidth: 480,
    margin: "0 auto 36px",
    lineHeight: 1.6,
    position: "relative" as const,
  },
  // Footer
  footer: {
    borderTop: "1px solid #1a1a24",
    padding: "28px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    color: "#4b4b5e",
  },
  footerOrange: {
    color: "#f97316",
  },
  // Divider
  divider: {
    height: 1,
    background: "linear-gradient(90deg, transparent, rgba(249,115,22,.15), transparent)",
    margin: "0",
  },
};

const features = [
  { num: "01", icon: "📊", name: "Dashboard", desc: "Painel com resumo total de clientes, veículos, registros e orçamentos" },
  { num: "02", icon: "👥", name: "Gestão de Clientes", desc: "Cadastro completo com histórico e veículos vinculados" },
  { num: "03", icon: "🚗", name: "Gestão de Veículos", desc: "Histórico técnico e orçamentos por veículo" },
  { num: "04", icon: "🔧", name: "Registros Técnicos", desc: "Histórico de manutenções por categoria, data e observações" },
  { num: "05", icon: "📄", name: "Orçamentos PDF", desc: "Criação de orçamentos com cálculo automático e PDF profissional" },
];

const benefits = [
  { icon: "📁", title: "Organização total", desc: "Controle de todas as informações da sua oficina em um só lugar" },
  { icon: "📋", title: "Histórico técnico", desc: "Histórico completo de manutenções de cada veículo sempre disponível" },
  { icon: "💼", title: "Orçamentos profissionais", desc: "PDFs com a identidade da sua oficina que geram confiança no cliente" },
  { icon: "⚡", title: "Mais agilidade", desc: "Menos papel, menos retrabalho. Foco no que realmente importa: seus clientes" },
];

export default function Landing() {
  return (
    <div style={S.page}>

      {/* ── NAVBAR ── */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          <img src="/carbuapplogo.png" alt="CarbuApp" style={S.navLogoImg} />
          <span style={S.navLogoText}>
            Carbu<span style={S.navLogoSpan}>App</span>
          </span>
        </div>
        <Link to="/login" style={S.navBtn}>
          Acessar Sistema →
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={S.hero}>
        {/* glow de fundo */}
        <div style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700, height: 400,
          background: "radial-gradient(ellipse, rgba(249,115,22,.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={S.heroBadge}>
          🏎️ Sistema Web para Oficinas de Pequeno Porte
        </div>

        <h1 style={S.heroTitle}>
          Gestão simples para{" "}
          <span style={S.heroOrange}>
            oficinas que trabalham de verdade.
          </span>
        </h1>

        <p style={S.heroSub}>
          Chega de papel e planilhas. O CarbuApp organiza clientes, veículos, registros técnicos e orçamentos profissionais em um só lugar.
        </p>

        <div style={S.heroActions}>
          <Link to="/login" style={S.btnPrimary}>
            Acessar Sistema →
          </Link>
          <a
            href="#funcionalidades"
            style={S.btnSecondary}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("funcionalidades")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Ver funcionalidades
          </a>
        </div>

        <div style={S.heroStats}>
          {[
            { num: "100%", label: "Web — acesse de qualquer lugar" },
            { num: "5", label: "Módulos integrados" },
            { num: "PDF", label: "Orçamentos profissionais" },
          ].map((s) => (
            <div key={s.label} style={S.heroStat}>
              <span style={S.heroStatNum}>{s.num}</span>
              <span style={S.heroStatLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={S.divider} />

      {/* ── PROBLEMA / SOLUÇÃO ── */}
      <section style={S.section}>
        <div style={S.sectionCenter}>
          <p style={S.eyebrow}>Por que o CarbuApp?</p>
          <h2 style={S.sectionTitle}>Você ainda perde tempo com papel?</h2>
          <p style={S.sectionSub}>A maioria das oficinas de pequeno porte ainda opera de forma manual. O resultado: perda de informações, erros e falta de profissionalismo.</p>
        </div>

        <div style={S.twoCol}>
          <div style={S.problemCard}>
            <div style={{ ...S.cardTitle, color: "#f87171" }}>
              <span>⚠️</span> O Problema
            </div>
            <p style={S.cardText}>
              Oficinas ainda trabalham com papel, cadernos ou planilhas simples. Isso gera perda de informações, erros e falta de profissionalismo na apresentação ao cliente.
            </p>
            <ul style={S.checkList}>
              {["Histórico perdido quando troca de caderno", "Orçamentos feitos à mão sem padrão", "Sem visão geral da oficina em tempo real"].map(t => (
                <li key={t} style={S.checkItem}>
                  <span style={{ ...S.checkIcon, color: "#f87171" }}>✕</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div style={S.solutionCard}>
            <div style={{ ...S.cardTitle, color: "#f97316" }}>
              <span>✅</span> A Solução
            </div>
            <p style={S.cardText}>
              CarbuApp é um sistema web de gestão para oficinas automotivas de pequeno porte. Simples de usar, de baixo custo e com visual profissional.
            </p>
            <ul style={S.checkList}>
              {["Simples e acessível — aprenda em minutos", "De baixo custo — cabe no orçamento da oficina", "Organizada e profissional — impressione seus clientes"].map(t => (
                <li key={t} style={S.checkItem}>
                  <span style={S.checkIcon}>✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div style={S.divider} />

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" style={S.section}>
        <div style={S.sectionCenter}>
          <p style={S.eyebrow}>O que está incluído</p>
          <h2 style={S.sectionTitle}>5 Funcionalidades Principais</h2>
          <p style={S.sectionSub}>Tudo que uma oficina precisa para funcionar de forma organizada e profissional.</p>
        </div>

        <div style={S.featuresGrid}>
          {features.map((f) => (
            <div key={f.num} style={S.featureCard}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(249,115,22,.35)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 30px rgba(0,0,0,.3)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#242430";
                (e.currentTarget as HTMLDivElement).style.transform = "";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              }}
            >
              <div style={S.featureNum}>{f.num}</div>
              <span style={S.featureIcon}>{f.icon}</span>
              <div style={S.featureName}>{f.name}</div>
              <div style={S.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={S.divider} />

      {/* ── PARA QUEM É ── */}
      <section style={{ ...S.section, background: "transparent" }}>
        <div style={S.sectionCenter}>
          <p style={S.eyebrow}>Para quem é o CarbuApp?</p>
          <h2 style={S.sectionTitle}>Feito para quem trabalha na ponta</h2>
        </div>

        <div style={S.personasGrid}>
          {[
            { emoji: "🔧", title: "Mecânicos experientes", desc: "Que ainda trabalham apenas com papel e querem modernizar a oficina sem complicação." },
            { emoji: "🚀", title: "Mecânicos iniciantes", desc: "Que estão montando a oficina e precisam de um sistema simples e acessível desde o começo." },
            { emoji: "🏪", title: "Oficinas de pequeno porte", desc: "Carros originais, preparações personalizadas, funilaria e mecânica geral que buscam profissionalismo." },
          ].map(p => (
            <div key={p.title} style={S.personaCard}>
              <span style={S.personaEmoji}>{p.emoji}</span>
              <div style={S.personaTitle}>{p.title}</div>
              <div style={S.personaDesc}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CLIENTES ── */}
      <div style={S.clientsBand}>
        <div style={S.clientsInner}>
          <div style={S.clientsLabel}>Quem já usa o CarbuApp</div>
          <div style={S.clientsRow}>
            {["Commenale Motorsports", "Apocalypse Custom"].map(c => (
              <div key={c} style={S.clientName}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color = "#f97316"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color = "#3a3a50"}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BENEFÍCIOS ── */}
      <section style={S.section}>
        <div style={S.sectionCenter}>
          <p style={S.eyebrow}>Benefícios para sua oficina</p>
          <h2 style={S.sectionTitle}>Tudo que você ganha ao usar o CarbuApp</h2>
        </div>

        <div style={S.benefitsGrid}>
          {benefits.map(b => (
            <div key={b.title} style={S.benefitRow}>
              <div style={S.benefitIcon}>{b.icon}</div>
              <div>
                <div style={S.benefitTitle}>{b.title}</div>
                <div style={S.benefitDesc}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={S.divider} />

      {/* ── CTA FINAL ── */}
      <section style={S.ctaBand}>
        <div style={S.ctaGlow} />
        <h2 style={S.ctaTitle}>
          Pronto para organizar<br />
          <span style={{ color: "#f97316" }}>sua oficina?</span>
        </h2>
        <p style={S.ctaSub}>
          Acesse agora e veja como o CarbuApp transforma a gestão da sua oficina.
        </p>
        <Link to="/login" style={{ ...S.btnPrimary, fontSize: 17, padding: "16px 40px", position: "relative" }}>
          Acessar Sistema →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <div style={S.footerText}>
          © {new Date().getFullYear()} <span style={S.footerOrange}>CarbuApp</span> — Sistema para Oficinas Automotivas
        </div>
        <div style={S.footerText}>
          carbuapp.com.br
        </div>
      </footer>

    </div>
  );
}
