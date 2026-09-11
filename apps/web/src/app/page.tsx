"use client";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

const highlights = [
  [
    "A Tasca do Bronze",
    "Restaurante",
    "Almeirim",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  ],
  [
    "A Adega",
    "Restaurante",
    "Fazendas de Almeirim",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
  ],
  [
    "Adega Novo Conceito",
    "Adega",
    "Fazendas de Almeirim",
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
  ],
];

export default function HomePage() {
  const { t } = useLanguage();
  const categories = [
    [
      "01",
      t("eat"),
      t("eatDetail"),
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
    ],
    [
      "02",
      t("sleep"),
      t("sleepDetail"),
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    ],
    [
      "03",
      t("leisure"),
      t("leisureDetail"),
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80",
    ],
  ];
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-10 lg:px-16">
        <p className="font-display text-xl font-semibold tracking-tight text-olive-900">
          {t("brand")}
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/ofertas"
            className="text-wine-700 hidden text-sm font-semibold sm:block"
          >
            {t("offers")}
          </Link>
          <Link href="/conta" className="text-wine-700 text-sm font-semibold">
            {t("account")}
          </Link>
          <Link
            href="/parceiros"
            className="hover:text-cream-50 rounded-full border border-olive-900/20 px-5 py-2 text-sm font-semibold text-olive-900 transition hover:bg-olive-900"
          >
            {t("partner")}
          </Link>
        </div>
      </header>
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 sm:px-10 lg:px-16 lg:pt-24 lg:pb-28">
        <div
          aria-hidden="true"
          className="bg-gold-500/15 absolute -top-20 -right-32 size-96 rounded-full blur-3xl"
        />
        <div className="relative max-w-4xl">
          <p className="text-wine-700 mb-8 text-xs font-semibold tracking-[0.28em] uppercase">
            {t("homeEyebrow")}
          </p>
          <h1 className="font-display text-5xl leading-[0.96] tracking-[-0.04em] text-olive-900 sm:text-7xl lg:text-8xl">
            {t("homeTitle")}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-olive-700 sm:text-xl">
            {t("homeDescription")}
          </p>
          <div className="mt-10 flex max-w-xl items-center rounded-full border border-olive-900/15 bg-white/70 p-2 shadow-sm">
            <span className="px-4 text-olive-700">⌕</span>
            <input
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
              placeholder={t("homeSearch")}
            />
            <Link
              href="/explorar"
              className="bg-wine-700 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-olive-900"
            >
              {t("explore")}
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-16">
        <div className="text-cream-50 rounded-3xl bg-olive-900 p-8 sm:p-12">
          <p className="text-gold-500 text-xs font-semibold tracking-[0.25em] uppercase">
            O Clube Ribatejo
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="font-display max-w-2xl text-4xl tracking-tight sm:text-5xl">
                Aproveite ainda mais sendo membro.
              </h2>
              <p className="text-cream-100/75 mt-4 max-w-2xl text-base leading-7">
                Benefícios exclusivos em restaurantes, experiências e lugares
                locais selecionados. Uma adesão válida por 12 meses.
              </p>
            </div>
            <Link
              href="/clube"
              className="bg-gold-500 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-olive-900"
            >
              Conhecer o Clube
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-16">
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map(([number, label, detail, image]) => (
            <Link
              key={label}
              href={`/explorar?categoria=${encodeURIComponent(label)}`}
              className="group bg-cream-100 hover:border-gold-500 rounded-3xl border border-olive-900/10 p-7 text-left transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="mb-6 h-36 rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${image})` }}
                aria-label={`Imagem ilustrativa de ${label}`}
              />
              <span className="text-gold-500 text-xs font-semibold tracking-[0.2em]">
                {number}
              </span>
              <h2 className="font-display mt-12 text-3xl text-olive-900">
                {label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-olive-700">{detail}</p>
              <span className="text-wine-700 mt-6 inline-block text-sm font-semibold">
                {t("seeSelection")}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          {t("howItWorks")}
        </p>
        <h2 className="font-display mt-5 max-w-2xl text-4xl tracking-tight text-olive-900 sm:text-5xl">
          {t("howTitle")}
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            [
              "01",
              "Escolha a região",
              "Começamos por Almeirim e pelos lugares que fazem a nossa terra especial.",
            ],
            [
              "02",
              "Encontre uma oferta",
              "Explore parceiros e veja as condições de cada benefício.",
            ],
            [
              "03",
              "Viva a experiência",
              "Visite o estabelecimento e apresente a sua membresia.",
            ],
            [
              "04",
              "Partilhe a descoberta",
              "Avalie a experiência e ajude a comunidade a escolher melhor.",
            ],
          ].map(([number, title, detail]) => (
            <article key={number} className="border-t border-olive-900/15 pt-5">
              <span className="text-gold-500 text-xs font-semibold tracking-[0.2em]">
                {number}
              </span>
              <h3 className="font-display mt-8 text-2xl text-olive-900">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-olive-700">{detail}</p>
            </article>
          ))}
        </div>
        <Link
          href="/ofertas"
          className="bg-wine-700 mt-10 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white"
        >
          {t("seeOffers")}
        </Link>
      </section>
      <section className="text-cream-50 bg-olive-900 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-gold-500 text-xs font-semibold tracking-[0.28em] uppercase">
            {t("firstDiscoveries")}
          </p>
          <h2 className="font-display mt-5 text-4xl tracking-tight sm:text-5xl">
            {t("placesToStart")}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map(([name, type, place, image]) => (
              <article
                key={name}
                className="border-cream-50/15 bg-cream-50/5 rounded-2xl border p-6"
              >
                <div
                  className="mb-6 h-40 rounded-2xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${image})` }}
                  aria-label={`Imagem ilustrativa de ${name}`}
                />
                <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase">
                  {type}
                </p>
                <h3 className="font-display mt-8 text-2xl">{name}</h3>
                <p className="text-cream-100/70 mt-2 text-sm">{place}</p>
                <button className="decoration-gold-500 mt-7 text-sm font-semibold underline underline-offset-4">
                  {t("seeProfile")}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
        <div className="border-gold-500/40 bg-gold-500/10 max-w-3xl rounded-3xl border p-8 sm:p-12">
          <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
            {t("ourVision")}
          </p>
          <h2 className="font-display mt-5 text-4xl tracking-tight text-olive-900 sm:text-5xl">
            {t("visionTitle")}
          </h2>
          <p className="mt-6 text-lg leading-8 text-olive-700">
            {t("visionText")}
          </p>
        </div>
      </section>
    </main>
  );
}
