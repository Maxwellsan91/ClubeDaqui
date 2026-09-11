export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-6 py-16 sm:px-10 lg:px-16">
      <div
        aria-hidden="true"
        className="bg-gold-500/15 absolute -top-36 -right-28 size-96 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-wine-700/10 absolute -bottom-48 -left-36 size-[30rem] rounded-full blur-3xl"
      />

      <section className="relative mx-auto w-full max-w-6xl">
        <p className="text-wine-700 mb-10 text-xs font-semibold tracking-[0.28em] uppercase">
          Santarém · Almeirim
        </p>

        <div className="max-w-4xl">
          <h1 className="font-display text-5xl leading-[0.96] tracking-[-0.04em] text-olive-900 sm:text-7xl lg:text-8xl">
            O melhor do Ribatejo, mais perto de si.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-olive-700 sm:text-xl">
            Estamos a preparar uma nova forma de descobrir restaurantes,
            experiências e benefícios exclusivos na nossa região.
          </p>
        </div>

        <div className="mt-12 flex items-center gap-4">
          <span className="bg-gold-500 h-px w-12" />
          <span className="text-sm tracking-wide text-olive-700">Em breve</span>
        </div>
      </section>
    </main>
  );
}
