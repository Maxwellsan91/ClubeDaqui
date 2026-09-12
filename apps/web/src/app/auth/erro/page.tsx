import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto max-w-xl">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-olive-900"
        >
          Clube Ribatejo
        </Link>
      </header>
      <section className="mx-auto max-w-xl py-24">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Confirmação de email
        </p>
        <h1 className="font-display mt-5 text-5xl tracking-tight text-olive-900">
          Este link já não é válido.
        </h1>
        <p className="mt-6 text-lg leading-8 text-olive-700">
          O link pode ter expirado ou já ter sido utilizado. Se a conta estiver
          confirmada, tente entrar; caso contrário, volte a iniciar o registo.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/entrar"
            className="bg-wine-700 inline-flex min-h-11 items-center rounded-full px-6 py-3 text-sm font-semibold text-white"
          >
            Entrar
          </Link>
          <Link
            href="/registar"
            className="inline-flex min-h-11 items-center rounded-full border border-olive-900/20 px-6 py-3 text-sm font-semibold text-olive-900"
          >
            Criar conta
          </Link>
        </div>
      </section>
    </main>
  );
}
