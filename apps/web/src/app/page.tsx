"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";

// ── data ──────────────────────────────────────────────────────────────────

const STATS = [
  { num: 50, prefix: "", suffix: "+", thousands: false, label: "Parceiros locais" },
  { num: 1200, prefix: "", suffix: "+", thousands: true, label: "Membros ativos" },
  { num: 1500, prefix: "€", suffix: "", thousands: true, label: "Poupados por ano" },
];

const HOW_STEPS = [
  { num: "1", title: "Aderir ao Clube", desc: "Escolha o plano anual e aceda imediatamente a todos os benefícios da rede." },
  { num: "2", title: "Descobrir parceiros", desc: "Explore mais de 50 estabelecimentos com condições exclusivas para membros." },
  { num: "3", title: "Apresentar e poupar", desc: "Mostre o seu cartão de membro e aproveite os descontos na hora, sem complicações." },
];

const CATEGORIES = [
  { label: "Comer", detail: "Restaurantes, tascas e sabores locais", href: "/explorar?categoria=Comer", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80" },
  { label: "Dormir", detail: "Alojamentos e espaços para descansar", href: "/explorar?categoria=Dormir", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80" },
  { label: "Lazer", detail: "Experiências para viver o Ribatejo", href: "/explorar?categoria=Lazer", image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80" },
];

const PARTNERS = [
  { name: "A Tasca do Bronze", type: "Restaurante", place: "Almeirim", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80" },
  { name: "A Adega", type: "Restaurante", place: "Fazendas de Almeirim", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80" },
  { name: "Adega Novo Conceito", type: "Adega", place: "Fazendas de Almeirim", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80" },
  { name: "Solar dos Presuntos", type: "Restaurante", place: "Almeirim", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80" },
  { name: "Quinta do Casal", type: "Enoturismo", place: "Santarém", image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80" },
  { name: "Casa da Ribeira", type: "Alojamento", place: "Almeirim", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80" },
  { name: "Pastelaria Central", type: "Café", place: "Almeirim", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80" },
  { name: "Herdade do Vale", type: "Lazer", place: "Alpiarça", image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=600&q=80" },
  { name: "Taberna do Rio", type: "Restaurante", place: "Santarém", image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=600&q=80" },
];

const TESTIMONIALS = [
  { name: "Maria S.", role: "Membro desde 2024", text: "Já poupei mais de €400 em apenas 3 meses. Vale cada cêntimo da anuidade." },
  { name: "João F.", role: "Membro desde 2023", text: "Descobri restaurantes incríveis que não sabia que existiam a 10 minutos de casa. Recomendo." },
  { name: "Ana R.", role: "Membro desde 2024", text: "A melhor forma de explorar o Ribatejo e ainda poupar. O cartão já se pagou na primeira semana." },
];

// ── animation hooks ───────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(to: number, active: boolean, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setVal(Math.round(eased * to));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, to, duration]);
  return val;
}

// Fade-up style — applied via style prop for zero runtime overhead
function fu(visible: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(26px)",
    transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
  };
}

function fmtStat(n: number, prefix: string, suffix: string, thousands: boolean) {
  if (thousands && n >= 1000) {
    return `${prefix}${Math.floor(n / 1000)} ${String(n % 1000).padStart(3, "0")}${suffix}`;
  }
  return `${prefix}${n}${suffix}`;
}

// ── stat block with count-up ──────────────────────────────────────────────

function AnimStat({ num, prefix, suffix, thousands, label, active, delay }: {
  num: number; prefix: string; suffix: string; thousands: boolean;
  label: string; active: boolean; delay: number;
}) {
  const val = useCountUp(num, active);
  return (
    <div style={fu(active, delay)}>
      <p className="font-display" style={{ color: "#b58b4a", fontSize: "clamp(1.75rem, 3.5vw, 2.2rem)", lineHeight: 1 }}>
        {fmtStat(val, prefix, suffix, thousands)}
      </p>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "5px", lineHeight: 1.4 }}>
        {label}
      </p>
    </div>
  );
}

// ── partner carousel ──────────────────────────────────────────────────────

function PartnerCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref, visible } = useInView();

  return (
    <section className="py-16 sm:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex items-end justify-between" style={fu(visible, 0)}>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: "#743b40" }}>
              A nossa rede
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-tight text-olive-900 sm:text-4xl">
              Parceiros escolhidos a dedo.
            </h2>
          </div>
          <Link
            href="/explorar"
            className="hidden text-sm font-semibold underline underline-offset-4 transition sm:block"
            style={{ color: "#743b40", textDecorationColor: "rgba(116,59,64,0.3)" }}
          >
            Ver todos →
          </Link>
        </div>
      </div>

      <div className="relative mt-8" style={fu(visible, 0.15)}>
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 sm:w-24"
          style={{ background: "linear-gradient(to right, #fdfbf6 0%, transparent 100%)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 sm:w-24"
          style={{ background: "linear-gradient(to left, #fdfbf6 0%, transparent 100%)" }}
          aria-hidden="true"
        />
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-5 pb-4 sm:gap-4 sm:px-8"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
        >
          {PARTNERS.map(({ name, type, place, image }) => (
            <Link
              key={name}
              href="/explorar"
              className="group w-40 flex-none overflow-hidden rounded-2xl border border-olive-900/10 bg-white shadow-sm transition hover:shadow-md sm:w-64"
              style={{ scrollSnapAlign: "start" }}
            >
              <div
                className="h-[100px] overflow-hidden bg-cover bg-center transition duration-500 group-hover:scale-105 sm:h-[160px]"
                style={{ backgroundImage: `url(${image})` }}
                aria-label={`Imagem de ${name}`}
              />
              <div className="p-3 sm:p-4">
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: "#b58b4a" }}>{type}</p>
                <h3 className="font-display mt-1 text-base leading-tight text-olive-900 transition-colors group-hover:text-wine-700 sm:mt-1.5 sm:text-lg">
                  {name}
                </h3>
                <p className="mt-0.5 text-[11px] text-olive-600">{place}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-7xl px-5 sm:hidden sm:px-8">
        <Link href="/explorar" className="text-sm font-semibold underline underline-offset-4" style={{ color: "#743b40" }}>
          Ver todos os parceiros →
        </Link>
      </div>
    </section>
  );
}

// ── page ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  // Hero parallax — direct DOM mutation, no re-render
  const heroBgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = () => {
      if (heroBgRef.current) {
        heroBgRef.current.style.transform = `translateY(${window.scrollY * 0.28}px)`;
      }
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const statsView = useInView(0.4);
  const howView   = useInView();
  const catsView  = useInView();
  const ctaView   = useInView();
  const testsView = useInView();
  const b2bView   = useInView();

  return (
    <main className="min-h-screen overflow-x-hidden">
      <AppHeader />

      {/* ── HERO ── editorial full-bleed */}
      <section className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden">
        {/* scale-110 gives room for parallax shift without showing edges */}
        <div
          ref={heroBgRef}
          className="absolute inset-0 scale-110 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80")',
            willChange: "transform",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, #243029 0%, rgba(36,48,41,0.65) 50%, rgba(36,48,41,0.12) 100%)" }}
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-32 sm:px-8 sm:pb-20 lg:pb-28">
          <p className="text-[11px] font-semibold tracking-[0.35em] uppercase" style={{ color: "#b58b4a" }}>
            Almeirim · Santarém · Ribatejo
          </p>
          <h1 className="font-display mt-4 leading-[0.93] tracking-tight text-white" style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}>
            Descubra o que<br />
            torna o{" "}
            <em className="font-display" style={{ color: "#b58b4a", fontStyle: "italic" }}>Ribatejo</em>
            <br />especial.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
            Um clube de benefícios para quem quer viver e apoiar o melhor que a nossa região tem para oferecer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/clube"
              className="inline-flex min-h-[48px] items-center rounded-full px-7 py-3 text-sm font-semibold transition"
              style={{ background: "#b58b4a", color: "#243029" }}
            >
              Juntar-me ao Clube
            </Link>
            <Link
              href="/explorar"
              className="inline-flex min-h-[48px] items-center rounded-full border px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.08)" }}
            >
              Ver parceiros →
            </Link>
          </div>

          {/* Stats — count-up on enter */}
          <div
            ref={statsView.ref}
            className="mt-12 grid grid-cols-3 gap-4 border-t pt-8 sm:max-w-md"
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            {STATS.map(({ num, prefix, suffix, thousands, label }, i) => (
              <AnimStat
                key={label}
                num={num}
                prefix={prefix}
                suffix={suffix}
                thousands={thousands}
                label={label}
                active={statsView.visible}
                delay={i * 0.12}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div ref={howView.ref}>
          <div style={fu(howView.visible, 0)}>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: "#743b40" }}>
              Como funciona
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-display text-3xl tracking-tight text-olive-900 sm:text-4xl lg:text-5xl">
                Simples assim.
              </h2>
              <Link
                href="/clube"
                className="text-sm font-semibold underline underline-offset-4 transition"
                style={{ color: "#743b40", textDecorationColor: "rgba(116,59,64,0.3)" }}
              >
                Conhecer a anuidade →
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {HOW_STEPS.map(({ num, title, desc }, i) => (
              <div key={num} className="flex flex-col" style={fu(howView.visible, 0.1 + i * 0.13)}>
                <span
                  className="font-display select-none text-[4.5rem] leading-none"
                  style={{ color: "rgba(181,139,74,0.35)" }}
                >
                  {num}
                </span>
                <h3 className="font-display mt-2 text-2xl text-olive-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-olive-700">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="px-5 py-16 sm:px-8 sm:py-20" style={{ background: "#f6f0e4" }}>
        <div ref={catsView.ref} className="mx-auto max-w-7xl">
          <p
            className="text-[11px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#5a6e5c", ...fu(catsView.visible, 0) }}
          >
            Descubra por categoria
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {CATEGORIES.map(({ label, detail, href, image }, i) => (
              <Link
                key={label}
                href={href}
                className="group relative overflow-hidden rounded-2xl"
                style={{ aspectRatio: "4/3", ...fu(catsView.visible, 0.08 + i * 0.13) }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(36,48,41,0.92) 0%, rgba(36,48,41,0.3) 55%, transparent 100%)" }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="font-display text-3xl text-white">{label}</h2>
                  <p className="mt-1 text-sm text-white/60">{detail}</p>
                  <span className="mt-3 inline-block text-sm font-semibold" style={{ color: "#b58b4a" }}>
                    Ver seleção →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNER NETWORK — carousel ── */}
      <PartnerCarousel />

      {/* ── CLUB CTA ── */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div ref={ctaView.ref} style={fu(ctaView.visible, 0)}>
          <div
            className="relative overflow-hidden rounded-3xl p-8 sm:p-14 lg:p-20"
            style={{ background: "#243029" }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-32 right-0 size-96 rounded-full blur-3xl"
              style={{ background: "rgba(181,139,74,0.18)" }}
            />
            <div className="relative max-w-2xl">
              <p className="text-[11px] font-semibold tracking-[0.25em] uppercase" style={{ color: "#b58b4a" }}>
                O Clube Ribatejo
              </p>
              <h2
                className="font-display mt-4 leading-tight tracking-tight text-white"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3.75rem)" }}
              >
                Aproveite ainda mais sendo membro.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-white/60">
                Benefícios ilimitados em restaurantes, alojamentos e experiências locais. Membros
                poupam em média <strong className="font-semibold text-white">€1 500 por ano</strong>.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Link
                  href="/clube"
                  className="inline-flex min-h-[48px] items-center rounded-full px-8 py-3 text-sm font-semibold transition"
                  style={{ background: "#b58b4a", color: "#243029" }}
                >
                  Aderir agora
                </Link>
                <div>
                  <p className="text-xl font-semibold text-white">€59,90</p>
                  <p className="text-xs text-white/40">/ano · sem custos ocultos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="px-5 py-16 sm:px-8 sm:py-24" style={{ background: "#f6f0e4" }}>
        <div ref={testsView.ref} className="mx-auto max-w-7xl">
          <div style={fu(testsView.visible, 0)}>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: "#743b40" }}>
              Membros
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-tight text-olive-900 sm:text-4xl">
              O que dizem quem já aderiu.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text }, i) => (
              <figure
                key={name}
                className="flex flex-col rounded-2xl border p-6"
                style={{
                  borderColor: "rgba(36,48,41,0.1)",
                  background: "#fdfbf6",
                  ...fu(testsView.visible, 0.1 + i * 0.13),
                }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} className="text-sm" style={{ color: "#b58b4a" }}>★</span>
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-6 text-olive-700">"{text}"</blockquote>
                <figcaption className="mt-5 border-t pt-4" style={{ borderColor: "rgba(36,48,41,0.08)" }}>
                  <p className="text-sm font-semibold text-olive-900">{name}</p>
                  <p className="mt-0.5 text-xs text-olive-600">{role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── B2B CTA ── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div
          ref={b2bView.ref}
          className="flex flex-col gap-6 rounded-2xl border p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10"
          style={{ borderColor: "rgba(36,48,41,0.1)", ...fu(b2bView.visible, 0) }}
        >
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: "#743b40" }}>
              Para estabelecimentos
            </p>
            <h2 className="font-display mt-3 text-2xl text-olive-900 sm:text-3xl">
              É um negócio local?<br />Junte-se à nossa rede.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-olive-700">
              Apresente o seu espaço a membros ativos que valorizam o que o Ribatejo tem de melhor.
            </p>
          </div>
          <Link
            href="/parceiros"
            className="inline-flex min-h-[48px] shrink-0 items-center rounded-full px-7 py-3 text-sm font-semibold text-white transition"
            style={{ background: "#743b40" }}
          >
            Ser parceiro →
          </Link>
        </div>
      </section>
    </main>
  );
}