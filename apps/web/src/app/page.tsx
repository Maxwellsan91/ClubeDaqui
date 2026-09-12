"use client";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { AppHeader } from "@/components/app-header";

const highlights = [
  {
    name: "A Tasca do Bronze",
    type: "Restaurante",
    place: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "A Adega",
    type: "Restaurante",
    place: "Fazendas de Almeirim",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Adega Novo Conceito",
    type: "Adega",
    place: "Fazendas de Almeirim",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
  },
];

export default function HomePage() {
  const { t } = useLanguage();
  const categories = [
    {
      number: "01",
      label: t("eat"),
      detail: t("eatDetail"),
      image:
        "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
    },
    {
      number: "02",
      label: t("sleep"),
      detail: t("sleepDetail"),
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    },
    {
      number: "03",
      label: t("leisure"),
      detail: t("leisureDetail"),
      image:
        "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <main className="min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-5 pt-12 pb-10 sm:px-8 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-24">
        <div
          aria-hidden="true"
          className="bg-gold-500/12 pointer-events-none absolute -top-16 right-0 size-[500px] rounded-full blur-3xl"
        />
        <div className="relative max-w-3xl">
          <p className="text-wine-700 text-[11px] font-semibold tracking-[0.3em] uppercase">
            {t("homeEyebrow")}
          </p>
          <h1 className="font-display mt-4 text-[2.8rem] leading-[1.02] tracking-[-0.025em] text-olive-900 sm:text-6xl lg:text-7xl xl:text-8xl">
            {t("homeTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-olive-700 sm:text-lg sm:leading-8">
            {t("homeDescription")}
          </p>

          {/* Search bar */}
          <div className="mt-8 flex items-center rounded-2xl border border-olive-900/12 bg-white shadow-sm sm:max-w-lg sm:rounded-full">
            <span className="pl-4 text-lg text-olive-600 select-none">⌕</span>
            <input
              className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm outline-none placeholder:text-olive-700/50"
              placeholder={t("homeSearch")}
              aria-label={t("homeSearch")}
            />
            <Link
              href="/explorar"
              className="bg-wine-700 hover:bg-wine-800 m-1.5 shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition sm:rounded-full"
            >
              {t("explore")}
            </Link>
          </div>
        </div>
      </section>

      {/* Category cards — horizontal scroll on mobile */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <p className="mb-5 text-[11px] font-semibold tracking-[0.25em] text-olive-600 uppercase">
          Descubra por categoria
        </p>
        <div className="-mx-5 flex scrollbar-none gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={`/explorar?categoria=${encodeURIComponent(cat.label)}`}
              className="group bg-cream-100 hover:border-gold-500/60 w-[220px] flex-none rounded-2xl border border-olive-900/10 p-5 transition hover:-translate-y-1 hover:shadow-md sm:w-auto"
            >
              <div
                className="h-28 rounded-xl bg-cover bg-center sm:h-36"
                style={{ backgroundImage: `url(${cat.image})` }}
                aria-label={`Imagem de ${cat.label}`}
              />
              <p className="text-gold-500 mt-4 text-[10px] font-bold tracking-[0.2em] uppercase">
                {cat.number}
              </p>
              <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                {cat.label}
              </h2>
              <p className="mt-1 text-sm leading-5 text-olive-700">
                {cat.detail}
              </p>
              <span className="text-wine-700 mt-4 inline-block text-sm font-semibold">
                {t("seeSelection")} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Club CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8">
        <div className="text-cream-50 relative overflow-hidden rounded-2xl bg-olive-900 p-7 sm:rounded-3xl sm:p-12">
          <div
            aria-hidden="true"
            className="bg-gold-500/20 absolute -top-20 right-0 size-60 rounded-full blur-3xl"
          />
          <p className="text-gold-500 relative text-[11px] font-semibold tracking-[0.25em] uppercase">
            O Clube Ribatejo
          </p>
          <div className="relative mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display max-w-sm text-[1.9rem] leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Aproveite ainda mais sendo membro.
              </h2>
              <p className="text-cream-100/70 mt-3 max-w-md text-sm leading-6 sm:text-base sm:leading-7">
                Benefícios exclusivos em restaurantes, experiências e lugares
                locais selecionados. Adesão válida por 12 meses.
              </p>
            </div>
            <Link
              href="/clube"
              className="bg-gold-500 hover:bg-gold-500/90 inline-flex min-h-[44px] w-fit shrink-0 items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-olive-900 transition"
            >
              Conhecer o Clube
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <p className="text-wine-700 text-[11px] font-semibold tracking-[0.3em] uppercase">
          {t("howItWorks")}
        </p>
        <h2 className="font-display mt-4 max-w-xl text-3xl tracking-tight text-olive-900 sm:text-4xl lg:text-5xl">
          {t("howTitle")}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Escolha a região",
              "Começamos por Almeirim e pelos lugares que fazem a nossa terra especial.",
            ],
            [
              "Encontre uma oferta",
              "Explore parceiros e veja as condições de cada benefício.",
            ],
            [
              "Viva a experiência",
              "Visite o estabelecimento e apresente a sua membresia.",
            ],
            [
              "Partilhe a descoberta",
              "Avalie a experiência e ajude a comunidade a escolher melhor.",
            ],
          ].map(([title, detail], i) => (
            <article
              key={title}
              className="border-t-2 border-olive-900/12 pt-5"
            >
              <span className="text-gold-500 text-[11px] font-bold tracking-[0.22em]">
                0{i + 1}
              </span>
              <h3 className="font-display mt-5 text-xl text-olive-900 sm:text-2xl">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-olive-700">{detail}</p>
            </article>
          ))}
        </div>
        <Link
          href="/explorar"
          className="bg-wine-700 hover:bg-wine-800 mt-10 inline-flex min-h-[44px] items-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition"
        >
          {t("seeOffers")}
        </Link>
      </section>

      {/* Highlights */}
      <section className="bg-olive-900 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-gold-500 text-[11px] font-semibold tracking-[0.28em] uppercase">
            {t("firstDiscoveries")}
          </p>
          <h2 className="font-display text-cream-50 mt-4 text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            {t("placesToStart")}
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {highlights.map(({ name, type, place, image }) => (
              <article
                key={name}
                className="border-cream-50/10 bg-cream-50/5 overflow-hidden rounded-2xl border"
              >
                <div
                  className="h-44 bg-cover bg-center"
                  style={{ backgroundImage: `url(${image})` }}
                  aria-label={`Imagem de ${name}`}
                />
                <div className="p-5">
                  <p className="text-gold-500 text-[10px] font-bold tracking-widest uppercase">
                    {type}
                  </p>
                  <h3 className="font-display text-cream-50 mt-2 text-xl sm:text-2xl">
                    {name}
                  </h3>
                  <p className="text-cream-100/60 mt-1 text-sm">{place}</p>
                  <Link
                    href="/explorar"
                    className="decoration-gold-500 text-cream-50 mt-4 inline-block text-sm font-semibold underline underline-offset-4"
                  >
                    {t("seeProfile")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="border-gold-500/30 bg-gold-500/8 max-w-2xl rounded-2xl border p-7 sm:rounded-3xl sm:p-10">
          <p className="text-wine-700 text-[11px] font-semibold tracking-[0.3em] uppercase">
            {t("ourVision")}
          </p>
          <h2 className="font-display mt-4 text-3xl tracking-tight text-olive-900 sm:text-4xl">
            {t("visionTitle")}
          </h2>
          <p className="mt-5 text-base leading-7 text-olive-700">
            {t("visionText")}
          </p>
        </div>
      </section>
    </main>
  );
}
