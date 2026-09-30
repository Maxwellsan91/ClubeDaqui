"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";

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
  const { ref, visible } = useInView();
  const [partners, setPartners] = useState<HomepagePartner[]>([]);
  const [state, setState] = useState<PartnersState>(
    apiUrl ? "loading" : "empty",
  );
  const [requestVersion, setRequestVersion] = useState(0);

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
    scrollRef.current?.scrollBy({
      left: direction * 288,
      behavior: "smooth",
    });
  }

  function retry() {
    setState("loading");
    setRequestVersion((version) => version + 1);
  }

  return (
    <section className="py-16 sm:py-24">
      <div ref={ref} className="mx-auto max-w-7xl px-5 sm:px-8">
        <div
          className="flex items-end justify-between gap-8"
          style={fu(visible, 0)}
        >
          <div>
            <p
              className="text-[11px] font-semibold tracking-[0.3em] uppercase"
              style={{ color: "#743b40" }}
            >
              A nossa rede
            </p>
            <h2 className="font-display mt-3 text-4xl tracking-tight text-olive-900 sm:text-5xl">
              Lugares que merecem ser descobertos.
            </h2>
          </div>
          <div className="hidden shrink-0 items-center gap-5 sm:flex">
            <button
              type="button"
              onClick={() => scrollPartners(-1)}
              className="text-wine-700 decoration-wine-700/30 hover:text-wine-800 text-sm font-semibold underline underline-offset-4 transition disabled:cursor-not-allowed disabled:opacity-40"
              disabled={state !== "ready"}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => scrollPartners(1)}
              className="text-wine-700 decoration-wine-700/30 hover:text-wine-800 text-sm font-semibold underline underline-offset-4 transition disabled:cursor-not-allowed disabled:opacity-40"
              disabled={state !== "ready"}
            >
              Seguinte
            </button>
            <Link
              href="/explorar"
              className="text-wine-700 decoration-wine-700/30 hover:text-wine-800 text-sm font-semibold underline underline-offset-4 transition"
            >
              Ver todos
            </Link>
          </div>
        </div>
      </div>

      <div className="relative mt-8" style={fu(visible, 0.15)}>
        <div
          className="from-cream-50 pointer-events-none absolute top-0 left-0 z-10 h-full w-16 bg-gradient-to-r to-transparent sm:w-24"
          aria-hidden="true"
        />
        <div
          className="from-cream-50 pointer-events-none absolute top-0 right-0 z-10 h-full w-16 bg-gradient-to-l to-transparent sm:w-24"
          aria-hidden="true"
        />
        <div aria-live="polite">
          {state === "loading" && (
            <div className="flex gap-3 overflow-hidden px-5 pb-4 sm:gap-4 sm:px-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-40 flex-none overflow-hidden rounded-2xl border border-olive-900/10 bg-white sm:w-64"
                  aria-hidden="true"
                >
                  <div className="h-[100px] animate-pulse bg-olive-900/10 sm:h-[160px]" />
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
              className="flex gap-3 overflow-x-auto px-5 pb-4 sm:gap-4 sm:px-8"
              style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
            >
              {partners.map(({ slug, name, kind, city, imageUrl }) => (
                <Link
                  key={slug}
                  href={`/explorar/${slug}`}
                  className="group w-40 flex-none overflow-hidden rounded-2xl border border-olive-900/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-64"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {imageUrl ? (
                    <div
                      className="h-[100px] overflow-hidden bg-cover bg-center transition duration-500 group-hover:scale-105 sm:h-[160px]"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                      role="img"
                      aria-label={`Fotografia de ${name}`}
                    />
                  ) : (
                    <div className="flex h-[100px] items-end bg-[linear-gradient(145deg,rgba(90,110,92,0.22),rgba(36,48,41,0.9))] p-3 sm:h-[160px] sm:p-4">
                      <span className="text-[10px] font-semibold tracking-[0.16em] text-white/75 uppercase">
                        Fotografia em breve
                      </span>
                    </div>
                  )}
                  <div className="p-3 sm:p-4">
                    <p className="text-wine-700 text-[9px] font-bold tracking-[0.2em] uppercase">
                      {kind}
                    </p>
                    <h3 className="font-display group-hover:text-wine-700 mt-1 text-base leading-tight text-olive-900 transition-colors sm:mt-1.5 sm:text-lg">
                      {name}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-olive-600">{city}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {(state === "empty" || state === "error") && (
            <div className="mx-5 border-t border-olive-900/15 py-8 sm:mx-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
              <div>
                <h3 className="font-display text-2xl text-olive-900">
                  {state === "error"
                    ? "A rede está temporariamente indisponível."
                    : "Estamos a preparar a rede local."}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-olive-700">
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
                    className="text-wine-700 decoration-wine-700/30 hover:text-wine-800 text-sm font-semibold underline underline-offset-4 transition"
                  >
                    Tentar novamente
                  </button>
                )}
                <Link
                  href="/explorar"
                  className="text-wine-700 decoration-wine-700/30 hover:text-wine-800 text-sm font-semibold underline underline-offset-4 transition"
                >
                  Explorar catálogo
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-7xl px-5 sm:hidden sm:px-8">
        <Link
          href="/explorar"
          className="text-sm font-semibold underline underline-offset-4"
          style={{ color: "#743b40" }}
        >
          Ver todos os parceiros
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
  const { ref: b2bRef, visible: b2bVisible } = useInView();

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

      {/* Club CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div
          ref={ctaRef}
          className="bg-cream-100 grid overflow-hidden rounded-2xl border border-olive-900/12 md:grid-cols-[1.35fr_0.65fr]"
          style={fu(ctaVisible, 0)}
        >
          <div className="p-8 sm:p-12 lg:p-16">
            <h2 className="font-display max-w-2xl text-4xl leading-tight tracking-tight text-olive-900 sm:text-5xl lg:text-6xl">
              Viva mais a região.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-olive-700">
              Benefícios em restaurantes, alojamentos e experiências locais,
              reunidos numa adesão anual.
            </p>
            <Link
              href="/clube"
              className="bg-wine-700 hover:bg-wine-800 mt-8 inline-flex min-h-[50px] items-center justify-center rounded-full px-8 py-3 text-sm font-semibold whitespace-nowrap text-white transition duration-300 hover:-translate-y-0.5 active:translate-y-px"
            >
              Aderir ao Clube
            </Link>
          </div>
          <div className="bg-wine-700 flex flex-col justify-between border-t border-olive-900/12 p-8 text-white sm:p-10 md:border-t-0 md:border-l">
            <p className="text-sm leading-6 text-white/75">
              Acesso durante 12 meses à rede e aos benefícios disponíveis.
            </p>
            <div className="mt-12">
              <p className="font-display text-5xl leading-none">€59,90</p>
              <p className="mt-3 text-sm text-white/70">
                por ano, sem custos ocultos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* B2B CTA */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div
          ref={b2bRef}
          className="grid gap-8 border-t border-olive-900/15 pt-10 md:grid-cols-[1fr_auto] md:items-end"
          style={fu(b2bVisible, 0)}
        >
          <div>
            <p
              className="text-[11px] font-semibold tracking-[0.3em] uppercase"
              style={{ color: "#743b40" }}
            >
              Para estabelecimentos
            </p>
            <h2 className="font-display mt-4 max-w-xl text-4xl leading-tight text-olive-900 sm:text-5xl">
              O seu negócio também pode fazer parte.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-olive-700">
              Apresente o seu espaço a pessoas que procuram e valorizam o que é
              feito na região.
            </p>
          </div>
          <Link
            href="/parceiros"
            className="inline-flex min-h-[50px] shrink-0 items-center justify-center rounded-full px-7 py-3 text-sm font-semibold whitespace-nowrap text-white transition duration-300 hover:-translate-y-0.5 active:translate-y-px"
            style={{ background: "#743b40" }}
          >
            Ser parceiro
          </Link>
        </div>
      </section>
    </main>
  );
}
