const categories = [
  ["01", "Comer", "Restaurantes, cafés e sabores locais"],
  ["02", "Dormir", "Alojamentos para ficar e descansar"],
  ["03", "Lazer", "Experiências para viver o Ribatejo"],
];

const highlights = [
  ["A Tasca do Bronze", "Restaurante", "Almeirim"],
  ["A Adega", "Restaurante", "Fazendas de Almeirim"],
  ["Adega Novo Conceito", "Adega", "Fazendas de Almeirim"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-10 lg:px-16">
        <p className="font-display text-xl font-semibold tracking-tight text-olive-900">
          Clube Ribatejo
        </p>
        <button className="hover:text-cream-50 rounded-full border border-olive-900/20 px-5 py-2 text-sm font-semibold text-olive-900 transition hover:bg-olive-900">
          Quero ser parceiro
        </button>
      </header>
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 sm:px-10 lg:px-16 lg:pt-24 lg:pb-28">
        <div
          aria-hidden="true"
          className="bg-gold-500/15 absolute -top-20 -right-32 size-96 rounded-full blur-3xl"
        />
        <div className="relative max-w-4xl">
          <p className="text-wine-700 mb-8 text-xs font-semibold tracking-[0.28em] uppercase">
            Almeirim · Santarém
          </p>
          <h1 className="font-display text-5xl leading-[0.96] tracking-[-0.04em] text-olive-900 sm:text-7xl lg:text-8xl">
            Descubra o que torna o Ribatejo especial.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-olive-700 sm:text-xl">
            Um guia local para encontrar lugares bons, experiências autênticas e
            benefícios exclusivos perto de si.
          </p>
          <div className="mt-10 flex max-w-xl items-center rounded-full border border-olive-900/15 bg-white/70 p-2 shadow-sm">
            <span className="px-4 text-olive-700">⌕</span>
            <input
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
              placeholder="O que procura em Almeirim?"
            />
            <a
              href="/explorar"
              className="bg-wine-700 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:bg-olive-900"
            >
              Explorar
            </a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:px-10 lg:px-16">
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map(([number, label, detail]) => (
            <button
              key={label}
              className="group bg-cream-100 hover:border-gold-500 rounded-3xl border border-olive-900/10 p-7 text-left transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-gold-500 text-xs font-semibold tracking-[0.2em]">
                {number}
              </span>
              <h2 className="font-display mt-12 text-3xl text-olive-900">
                {label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-olive-700">{detail}</p>
              <span className="text-wine-700 mt-6 inline-block text-sm font-semibold">
                Ver seleção →
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="text-cream-50 bg-olive-900 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-gold-500 text-xs font-semibold tracking-[0.28em] uppercase">
            Primeiras descobertas
          </p>
          <h2 className="font-display mt-5 text-4xl tracking-tight sm:text-5xl">
            Lugares para começar
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map(([name, type, place]) => (
              <article
                key={name}
                className="border-cream-50/15 bg-cream-50/5 rounded-2xl border p-6"
              >
                <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase">
                  {type}
                </p>
                <h3 className="font-display mt-8 text-2xl">{name}</h3>
                <p className="text-cream-100/70 mt-2 text-sm">{place}</p>
                <button className="decoration-gold-500 mt-7 text-sm font-semibold underline underline-offset-4">
                  Ver ficha
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
