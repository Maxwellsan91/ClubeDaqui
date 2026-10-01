"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { SavingsByCategory } from "@/components/savings-by-category";
import { SavingsOverview } from "@/components/savings-overview";
import type { MemberSummaryData, SavingsRecord } from "@/types/member";

// Data

const HOW_STEPS = [
  {
    num: "1",
    title: "Aderir ao Clube",
    desc: "Escolha o plano anual e aceda imediatamente a todos os benefícios da rede.",
  },
  {
    num: "2",
    title: "Descobrir parceiros",
    desc: "Explore estabelecimentos e experiências locais com condições para membros.",
  },
  {
    num: "3",
    title: "Apresentar e poupar",
    desc: "Mostre o seu cartão de membro e aproveite os descontos na hora, sem complicações.",
  },
];

const CATEGORIES = [
  {
    label: "Comer",
    detail: "Restaurantes, tascas e sabores locais",
    href: "/explorar?categoria=Comer",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Dormir",
    detail: "Alojamentos e espaços para descansar",
    href: "/explorar?categoria=Dormir",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
  {
    label: "Lazer",
    detail: "Experiências para viver daqui",
    href: "/explorar?categoria=Lazer",
    image:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80",
  },
];

type HomepagePartner = {
  slug: string;
  name: string;
  kind: string;
  city: string;
  imageUrl: string | null;
};

type PartnersState = "loading" | "ready" | "empty" | "error";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const memberDemoRecords: SavingsRecord[] = [
  ["member-demo-1", "Gastronomia", 18, "2026-09-18T12:00:00.000Z"],
  ["member-demo-2", "Experiências", 16, "2026-08-23T12:00:00.000Z"],
  ["member-demo-3", "Alojamento", 24, "2026-07-12T12:00:00.000Z"],
  ["member-demo-4", "Gastronomia", 22, "2026-06-04T12:00:00.000Z"],
  ["member-demo-5", "Lazer", 24, "2026-05-19T12:00:00.000Z"],
  ["member-demo-6", "Gastronomia", 20, "2026-04-08T12:00:00.000Z"],
].map(([id, category, discountAmount, redeemedAt]) => ({
  id: id as string,
  businessName: "Parceiro de demonstração",
  businessSlug: "",
  category: category as SavingsRecord["category"],
  redeemedAt: redeemedAt as string,
  totalBillAmount: Number(discountAmount) * 2,
  discountAmount: Number(discountAmount),
}));

const memberDemoSummary: MemberSummaryData = {
  fullName: "Ana",
  subscriptionStatus: "active",
  validUntil: null,
  usedBenefits: 6,
  availableBenefits: 4,
  totalBenefits: 10,
  potentialSavings: 180,
  subscriptionPrice: 59.9,
};

// Animation hooks

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// Fade-up style applied via style prop for zero runtime overhead
function fu(visible: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translateY(26px)",
    transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
  };
}

// Partner carousel

function PartnerCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { ref, visible } = useInView();
  const [partners, setPartners] = useState<HomepagePartner[]>([]);
  const [state, setState] = useState<PartnersState>(
    apiUrl ? "loading" : "empty",
  );
  const [requestVersion, setRequestVersion] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!apiUrl) return;

    const controller = new AbortController();
    fetch(`${apiUrl}/api/businesses`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar a rede");
        return response.json() as Promise<{
          data?: Array<{
            slug?: string;
            name?: string;
            kind?: string;
            category?: string;
            city?: string;
            imageUrl?: string | null;
          }>;
        }>;
      })
      .then((payload) => {
        const nextPartners = (payload.data ?? [])
          .filter(
            (item): item is typeof item & { slug: string; name: string } =>
              Boolean(item.slug && item.name),
          )
          .slice(0, 9)
          .map((item) => ({
            slug: item.slug,
            name: item.name,
            kind: item.kind || item.category || "Estabelecimento local",
            city: item.city || "Ribatejo",
            imageUrl: item.imageUrl ?? null,
          }));

        setPartners(nextPartners);
        setActiveIndex(0);
        setState(nextPartners.length > 0 ? "ready" : "empty");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setState("error");
      });

    return () => controller.abort();
  }, [requestVersion]);

  function scrollPartners(direction: -1 | 1) {
    const container = scrollRef.current;
    if (!container || partners.length === 0) return;
    const nextIndex = Math.min(
      Math.max(activeIndex + direction, 0),
      partners.length - 1,
    );
    setActiveIndex(nextIndex);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const card = container.children[nextIndex] as HTMLElement | undefined;
        if (!card) return;
        const padding = Number.parseFloat(
          getComputedStyle(container).paddingLeft,
        );
        container.scrollTo({
          left: card.offsetLeft - padding,
          behavior: "smooth",
        });
      });
    });
  }

  function updateActivePartner() {
    const container = scrollRef.current;
    if (!container) return;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const padding = Number.parseFloat(
        getComputedStyle(container).paddingLeft,
      );
      const left = container.scrollLeft + padding + 8;
      let selected = 0;
      Array.from(container.children).forEach((child, index) => {
        const card = child as HTMLElement;
        if (card.offsetLeft <= left) selected = index;
      });
      setActiveIndex(selected);
    }, 100);
  }

  function retry() {
    setState("loading");
    setRequestVersion((version) => version + 1);
  }

  return (
    <section className="dark-olive-surface overflow-hidden bg-[#172923] py-16 sm:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end sm:gap-8"
          style={fu(visible, 0)}
        >
          <div>
            <p className="text-gold-400 text-[11px] font-semibold tracking-[0.3em] uppercase">
              Lugares do Ribatejo
            </p>
            <h2 className="font-display text-cream-50 mt-3 max-w-3xl text-4xl leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Descubra o Ribatejo, um lugar de cada vez.
            </h2>
            <p className="text-cream-100/70 mt-4 max-w-2xl text-sm leading-6 sm:text-base sm:leading-7">
              Da mesa posta à escapadinha de fim de semana, encontre espaços
              locais para fazer planos — e vantagens para aproveitar pelo
              caminho.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/explorar"
              className="border-cream-50/25 text-cream-50 hover:border-cream-50 hover:bg-cream-50 inline-flex rounded-full border px-5 py-3 text-sm font-semibold transition hover:text-olive-900"
            >
              Explorar todos
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mt-8" style={fu(visible, 0.15)}>
        <div
          className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-gradient-to-r from-[#172923] to-transparent sm:w-16"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l from-[#172923] to-transparent sm:w-16"
          aria-hidden="true"
        />
        <div aria-live="polite">
          {state === "loading" && (
            <div className="flex gap-3 overflow-hidden px-5 pb-4 sm:gap-4 sm:px-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[78vw] max-w-[340px] flex-none overflow-hidden rounded-[1.5rem] border border-olive-900/10 bg-white sm:w-[300px]"
                  aria-hidden="true"
                >
                  <div className="h-[280px] animate-pulse bg-olive-900/10 sm:h-[340px]" />
                  <div className="space-y-3 p-4">
                    <div className="h-2 w-20 animate-pulse rounded-full bg-olive-900/10" />
                    <div className="h-5 w-4/5 animate-pulse rounded-full bg-olive-900/10" />
                    <div className="h-3 w-2/5 animate-pulse rounded-full bg-olive-900/10" />
                  </div>
                </div>
              ))}
              <span className="sr-only">A carregar estabelecimentos</span>
            </div>
          )}

          {state === "ready" && (
            <div
              ref={scrollRef}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[6vw] pb-5 sm:gap-5 sm:px-[7vw]"
              style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
              onScroll={updateActivePartner}
            >
              {partners.map(({ slug, name, kind, city, imageUrl }, index) => {
                const active = activeIndex === index;
                const genericCategory = CATEGORIES[index % CATEGORIES.length];
                const displayImage = imageUrl ?? genericCategory.image;

                return (
                  <div
                    key={slug}
                    className={`group/slide relative h-[380px] flex-none transition-[width] duration-500 sm:h-[min(50vw,610px)] ${
                      active
                        ? "w-[76vw] max-w-[760px] sm:w-[60vw]"
                        : "w-[53vw] max-w-[300px] sm:w-[24vw]"
                    }`}
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <Link
                      href={`/explorar/${slug}`}
                      aria-label={`${name}, ${kind}, ${city}${imageUrl ? "" : ", imagem ilustrativa"}`}
                      className="absolute inset-0 overflow-hidden rounded-[1.5rem] bg-olive-900 shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/slide:scale-[1.04]"
                        style={{
                          backgroundImage: `linear-gradient(180deg,rgba(18,34,28,0.04) 20%,rgba(18,34,28,0.88) 100%),url("${displayImage}")`,
                        }}
                        aria-hidden="true"
                      />
                      <span className="absolute top-5 left-5 rounded-full border border-white/35 bg-olive-900/30 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm sm:top-7 sm:left-7 sm:text-xs">
                        {kind}
                      </span>
                      {!imageUrl && (
                        <span className="absolute top-5 right-5 rounded-full bg-black/25 px-2.5 py-1 text-[9px] font-medium text-white/85 backdrop-blur-sm sm:top-7 sm:right-7">
                          Imagem ilustrativa · {genericCategory.label}
                        </span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-5 text-left sm:p-8 lg:p-10">
                        <p className="text-xs font-medium tracking-wide text-white/75 sm:text-sm">
                          {city}
                        </p>
                        <h3
                          className={`font-display mt-2 max-w-[15ch] leading-[1.02] text-white ${
                            active
                              ? "text-3xl sm:text-5xl lg:text-6xl"
                              : "text-xl sm:text-2xl"
                          }`}
                        >
                          {name}
                        </h3>
                        {active && (
                          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/90 sm:mt-7">
                            Conhecer espaço <span aria-hidden="true">↗</span>
                          </span>
                        )}
                      </div>
                    </Link>
                    {active && index < partners.length - 1 && (
                      <button
                        type="button"
                        onClick={() => scrollPartners(1)}
                        aria-label="Avançar para o próximo lugar"
                        className="bg-cream-50 focus-visible:ring-gold-400 absolute top-1/2 -right-6 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-[#172923] text-xl text-olive-900 shadow-xl transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none sm:-right-8 sm:h-16 sm:w-16 sm:text-2xl"
                      >
                        <span aria-hidden="true">→</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(state === "empty" || state === "error") && (
            <div className="mx-5 border-t border-olive-900/15 py-8 sm:mx-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
              <div>
                <h3 className="font-display text-cream-50 text-2xl">
                  {state === "error"
                    ? "A rede está temporariamente indisponível."
                    : "Estamos a preparar a rede local."}
                </h3>
                <p className="text-cream-100/70 mt-2 max-w-xl text-sm leading-6">
                  {state === "error"
                    ? "Pode tentar novamente ou explorar o catálogo completo."
                    : "Os estabelecimentos aparecem aqui assim que os dados estiverem publicados."}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-5 sm:mt-0 sm:shrink-0">
                {state === "error" && (
                  <button
                    type="button"
                    onClick={retry}
                    className="text-gold-300 hover:text-gold-400 text-sm font-semibold underline underline-offset-4 transition"
                  >
                    Tentar novamente
                  </button>
                )}
                <Link
                  href="/explorar"
                  className="text-gold-300 hover:text-gold-400 text-sm font-semibold underline underline-offset-4 transition"
                >
                  Explorar catálogo
                </Link>
              </div>
            </div>
          )}
        </div>
        {state === "ready" && partners[activeIndex] && (
          <div className="mx-auto mt-1 flex max-w-7xl items-center gap-4 px-5 sm:px-8">
            <p className="text-cream-50 min-w-0 flex-1 truncate text-xs font-medium">
              {partners[activeIndex].name}
              <span className="text-cream-100/60 ml-2">
                {partners[activeIndex].city}
              </span>
            </p>
            <div
              className="h-px w-20 flex-none bg-white/20 sm:w-32"
              aria-hidden="true"
            >
              <div
                className="bg-gold-400 h-px transition-[width] duration-300"
                style={{
                  width: `${((activeIndex + 1) / partners.length) * 100}%`,
                }}
              />
            </div>
            <p className="text-cream-100/70 flex-none font-mono text-[11px]">
              {String(activeIndex + 1).padStart(2, "0")}
              <span className="text-cream-100/40 mx-1">/</span>
              {String(partners.length).padStart(2, "0")}
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto mt-4 max-w-7xl px-5 sm:hidden sm:px-8">
        <Link
          href="/explorar"
          className="text-sm font-semibold underline underline-offset-4"
          style={{ color: "#743b40" }}
        >
          Explorar todos os lugares
        </Link>
      </div>
    </section>
  );
}

// Page

export default function HomePage() {
  const { ref: howRef, visible: howVisible } = useInView();
  const { ref: catsRef, visible: catsVisible } = useInView();
  const { ref: ctaRef, visible: ctaVisible } = useInView();

  return (
    <main className="min-h-[100dvh] overflow-x-hidden">
      <AppHeader />

      {/* Hero */}
      <section className="relative flex min-h-[calc(88svh-60px)] flex-col justify-end overflow-hidden sm:min-h-[calc(100dvh-60px)]">
        <Image
          src="/hero-ribatejo-v2.jpg"
          alt="Mesa portuguesa ao pôr do sol, entre vinhas e sobreiros do Ribatejo"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center] motion-safe:animate-[hero-settle_1.2s_cubic-bezier(0.16,1,0.3,1)_both]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(18,27,21,0.94) 0%, rgba(18,27,21,0.78) 38%, rgba(18,27,21,0.22) 72%, rgba(18,27,21,0.08) 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-14 pb-10 sm:px-8 sm:pt-24 sm:pb-16 lg:pb-20">
          <h1
            className="font-display max-w-3xl leading-[0.92] tracking-[-0.045em] text-white motion-safe:animate-[hero-rise_0.8s_cubic-bezier(0.16,1,0.3,1)_both]"
            style={{ fontSize: "clamp(2rem, 10vw, 6.75rem)" }}
          >
            <span className="block whitespace-nowrap">O melhor daqui,</span>
            <span className="block whitespace-nowrap">mais perto de si.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/75 motion-safe:animate-[hero-rise_0.8s_0.1s_cubic-bezier(0.16,1,0.3,1)_both] sm:text-lg">
            Descubra lugares locais, aproveite benefícios e faça parte da
            economia da nossa região.
          </p>
          <div className="mt-8 max-w-2xl motion-safe:animate-[hero-rise_0.8s_0.18s_cubic-bezier(0.16,1,0.3,1)_both]">
            <form
              action="/explorar"
              method="get"
              className="hero-search-shell grid gap-2 rounded-2xl border border-white/35 bg-white/94 p-2 shadow-[0_18px_50px_rgba(18,27,21,0.24)] backdrop-blur-md sm:grid-cols-[1fr_auto] sm:rounded-full"
              role="search"
            >
              <label className="min-w-0 px-3 pt-1 sm:px-4 sm:pt-0">
                <span className="text-wine-700 block text-xs font-bold">
                  Encontrar um lugar
                </span>
                <input
                  type="search"
                  name="q"
                  className="hero-search-input mt-0.5 w-full bg-transparent py-1 text-base text-olive-900 outline-none placeholder:text-olive-700/55"
                  placeholder="Nome, local ou tipo"
                  autoComplete="off"
                />
              </label>
              <button
                type="submit"
                className="bg-gold-500 min-h-[50px] rounded-full px-7 text-sm font-bold whitespace-nowrap text-olive-900 transition duration-300 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-px"
              >
                Pesquisar
              </button>
            </form>
            <Link
              href="/clube"
              className="mt-4 inline-flex min-h-[40px] items-center text-sm font-semibold text-white underline decoration-white/35 underline-offset-4 transition hover:decoration-white active:translate-y-px"
            >
              Conhecer o Clube
            </Link>
          </div>
        </div>
      </section>

      {/* Member area preview */}
      <section className="bg-cream-100 overflow-hidden px-5 py-12 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-6 sm:gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <div className="max-w-xl">
            <p className="text-wine-700 text-[11px] font-semibold tracking-[0.28em] uppercase">
              Veja como funciona a app
            </p>
            <h2 className="font-display mt-4 text-4xl leading-tight tracking-tight text-olive-900 sm:text-5xl lg:text-6xl">
              Descobrir. Aproveitar. Poupar.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-olive-700 sm:text-lg sm:leading-8">
              Os melhores planos começam com um lugar novo. Encontre parceiros
              locais, consulte as vantagens disponíveis e acompanhe o que já
              poupou — tudo na área de membro.
            </p>
            <ol className="mt-8 space-y-3">
              {[
                {
                  number: "01",
                  title: "Encontre o próximo sítio",
                  description:
                    "Explore restaurantes, alojamentos e experiências da região.",
                },
                {
                  number: "02",
                  title: "Veja a vantagem antes de ir",
                  description:
                    "Consulte os detalhes e as condições de cada benefício.",
                },
                {
                  number: "03",
                  title: "Aproveite e acompanhe a poupança",
                  description:
                    "Use o benefício no parceiro e veja as suas economias na área de membro.",
                },
              ].map(({ number, title, description }) => (
                <li
                  key={number}
                  className="member-step-card flex items-start gap-4 rounded-2xl border border-olive-900/10 bg-white/55 p-4 sm:p-5"
                >
                  <span className="font-display text-cream-50 flex h-10 w-10 flex-none items-center justify-center rounded-full bg-olive-900 text-sm">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-olive-900 sm:text-base">
                      {title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-olive-700">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-xs leading-5 text-olive-600">
              Exemplo ilustrativo: 124,00 € poupados em seis utilizações; após
              59,90 € de adesão, saldo de 64,10 €.
            </p>
          </div>

          <div className="relative flex min-h-[540px] items-center justify-center py-4 sm:min-h-[640px]">
            <div
              className="member-phone-shadow absolute bottom-10 left-1/2 z-0 h-5 w-40 -translate-x-1/2 rounded-[50%] bg-olive-900/20 blur-[10px]"
              aria-hidden="true"
            />
            <div
              className="member-phone relative z-10 w-[258px] rounded-[2.7rem] border-[7px] border-[#202720] bg-[#202720] p-[5px] shadow-[0_28px_70px_rgba(36,48,41,0.22)] sm:w-[278px]"
              role="img"
              aria-label="Pré-visualização da área real de membro com dados demonstrativos: seis utilizações, 124 euros poupados e saldo positivo de 64,10 euros"
            >
              <div className="member-phone-screen relative h-[506px] w-[234px] overflow-hidden rounded-[2.1rem] bg-[#f8f7f2] sm:h-[548px] sm:w-[254px]">
                <div
                  className="pointer-events-none absolute top-4 left-0 h-[817px] w-[390px] origin-top-left scale-[0.6] overflow-hidden bg-[#f8f7f2] sm:scale-[0.65]"
                  aria-hidden="true"
                >
                  <div className="px-5 pt-9 pb-8">
                    <div className="flex items-center gap-3">
                      <span className="text-cream-50 flex h-10 w-10 items-center justify-center rounded-full bg-olive-900 text-sm font-semibold">
                        CD
                      </span>
                      <div>
                        <p className="text-wine-700 text-[11px] font-semibold tracking-[0.18em] uppercase">
                          Clube Daqui
                        </p>
                        <p className="mt-0.5 text-xs text-olive-700">
                          Área de membro
                        </p>
                      </div>
                    </div>
                    <h3 className="font-display mt-5 text-[26px] leading-tight text-olive-900">
                      Olá, Ana
                    </h3>
                    <p className="mt-1 text-sm text-olive-700">
                      As suas poupanças no Ribatejo.
                    </p>
                    <div className="mt-5">
                      <SavingsOverview
                        records={memberDemoRecords}
                        summary={memberDemoSummary}
                      />
                    </div>
                    <div className="mt-4">
                      <SavingsByCategory records={memberDemoRecords} />
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-4 items-center justify-between bg-[#f8f7f2] px-3 text-[7px] font-semibold text-olive-900">
                  <span>9:41</span>
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="flex h-2 items-end gap-[1px]">
                      <span className="h-1 w-[2px] rounded-t-sm bg-olive-800" />
                      <span className="h-1.5 w-[2px] rounded-t-sm bg-olive-800" />
                      <span className="h-2 w-[2px] rounded-t-sm bg-olive-800" />
                    </span>
                    <span className="flex items-center gap-[1px]">
                      <span className="flex h-[9px] w-4 items-center rounded-[2px] border border-olive-800 p-[1px]">
                        <span className="h-full w-full rounded-[1px] bg-olive-800" />
                      </span>
                      <span className="h-1 w-[2px] rounded-r-sm bg-olive-800" />
                    </span>
                  </span>
                </div>
              </div>
              <div
                className="pointer-events-none absolute top-[9px] left-1/2 h-[17px] w-[82px] -translate-x-1/2 rounded-full bg-[#202720]"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div ref={howRef}>
          <div className="max-w-2xl" style={fu(howVisible, 0)}>
            <h2 className="font-display text-4xl leading-tight tracking-tight text-olive-900 sm:text-5xl lg:text-6xl">
              Aderir. Descobrir. Aproveitar.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-olive-700">
              Uma adesão simples para conhecer melhor a região e apoiar quem faz
              parte dela.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-12 md:gap-6">
            {HOW_STEPS.map(({ num, title, desc }, i) => (
              <div
                key={num}
                className={`border-t border-olive-900/15 pt-5 ${
                  i === 0
                    ? "md:col-span-5"
                    : i === 1
                      ? "md:col-span-3"
                      : "md:col-span-4"
                }`}
                style={fu(howVisible, 0.1 + i * 0.13)}
              >
                <span className="font-display text-gold-500/55 text-5xl leading-none select-none">
                  0{num}
                </span>
                <h3 className="font-display mt-6 text-2xl leading-tight text-olive-900">
                  {title}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-olive-700">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-cream-100 px-5 py-16 sm:px-8 sm:py-20">
        <div ref={catsRef} className="mx-auto max-w-7xl">
          <div className="max-w-2xl" style={fu(catsVisible, 0)}>
            <h2 className="font-display text-4xl leading-tight tracking-tight text-olive-900 sm:text-5xl">
              Há sempre mais para descobrir.
            </h2>
            <p className="mt-4 text-base leading-7 text-olive-700">
              Escolha o momento. Nós mostramos os lugares.
            </p>
          </div>
          <div
            className="-mx-5 mt-8 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 md:mx-0 md:mt-10 md:grid md:grid-cols-12 md:grid-rows-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Categorias para explorar"
          >
            {CATEGORIES.map(({ label, detail, href, image }, i) => (
              <Link
                key={label}
                href={href}
                className={`group relative min-h-[280px] w-[82vw] max-w-[340px] flex-none snap-start overflow-hidden rounded-2xl sm:min-h-[300px] md:min-h-0 md:w-auto md:max-w-none ${
                  i === 0
                    ? "md:col-span-7 md:row-span-2 md:h-[620px]"
                    : "md:col-span-5 md:h-[302px]"
                }`}
                style={{
                  ...fu(catsVisible, 0.08 + i * 0.13),
                }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${image})` }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(36,48,41,0.92) 0%, rgba(36,48,41,0.3) 55%, transparent 100%)",
                  }}
                />
                <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8">
                  <h3
                    className={`font-display leading-none text-white ${i === 0 ? "text-5xl sm:text-6xl" : "text-4xl"}`}
                  >
                    {label}
                  </h3>
                  <p className="mt-3 max-w-xs text-sm text-white/75">
                    {detail}
                  </p>
                  <span
                    className="mt-5 inline-block text-sm font-semibold"
                    style={{ color: "#b58b4a" }}
                  >
                    Ver seleção
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Partner network */}
      <PartnerCarousel />

      {/* Partner CTA */}
      <section className="bg-cream-100 px-5 py-16 sm:px-8 sm:py-24">
        <div
          ref={ctaRef}
          className="dark-olive-surface mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-olive-900 shadow-[0_24px_70px_rgba(36,48,41,0.16)] md:grid-cols-[1.1fr_0.9fr]"
          style={fu(ctaVisible, 0)}
        >
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="text-gold-400 text-[11px] font-semibold tracking-[0.28em] uppercase">
              Para negócios locais
            </p>
            <h2 className="font-display text-cream-50 mt-5 max-w-2xl text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              O seu espaço merece ser descoberto.
            </h2>
            <p className="text-cream-100/70 mt-5 max-w-xl text-base leading-7 sm:text-lg sm:leading-8">
              Damos visibilidade ao que é nosso. Apresente o seu estabelecimento
              a pessoas que querem conhecer e aproveitar melhor a região.
            </p>
            <Link
              href="/parceiros"
              className="bg-gold-400 hover:bg-gold-300 focus-visible:ring-cream-50 mt-8 inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full px-7 py-3 text-sm font-semibold text-olive-900 transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none"
            >
              Quero ser parceiro <span aria-hidden="true">→</span>
            </Link>
            <p className="text-cream-100/55 mt-4 text-xs">
              Sem mensalidade para participar · Defina as condições do seu
              benefício
            </p>
          </div>

          <div className="group/partner-image relative flex min-h-[360px] flex-col justify-between gap-7 overflow-hidden border-t border-white/10 p-6 sm:min-h-[500px] sm:gap-8 sm:p-12 md:border-t-0 md:border-l lg:p-14">
            <Image
              src="/hero-ribatejo-v2.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="partner-cta-image object-cover object-[64%_center]"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,41,35,0.45)_0%,rgba(23,41,35,0.76)_48%,rgba(23,41,35,0.96)_100%)]"
              aria-hidden="true"
            />
            <div
              className="partner-cta-orbit border-gold-400/30 pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full border"
              aria-hidden="true"
            />
            <div
              className="partner-cta-orbit partner-cta-orbit-delayed border-gold-400/25 pointer-events-none absolute -top-12 -right-4 h-48 w-48 rounded-full border"
              aria-hidden="true"
            />
            <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-cream-50/80 max-w-sm text-sm leading-6">
                Uma parceria simples, pensada para o ritmo do seu negócio.
              </p>
              <span className="text-cream-50/85 flex-none rounded-full border border-white/25 bg-olive-950/30 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase backdrop-blur-sm sm:tracking-[0.16em]">
                Ribatejo · Rede local
              </span>
            </div>
            <ol className="relative space-y-6">
              {[
                ["01", "Apareça no guia local"],
                ["02", "Defina uma vantagem para membros"],
                ["03", "Valide utilizações no seu espaço"],
              ].map(([number, label]) => (
                <li
                  key={number}
                  className="flex items-center gap-4 border-b border-white/20 pb-5 last:border-0 last:pb-0"
                >
                  <span className="font-display text-gold-400 text-2xl">
                    {number}
                  </span>
                  <span className="text-cream-50 text-sm font-medium sm:text-base">
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            <Link
              href="/parceiros"
              className="text-cream-50 hover:decoration-gold-400 relative inline-flex items-center gap-2 text-sm font-semibold underline decoration-white/50 underline-offset-4 transition"
            >
              Saber como funciona <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
