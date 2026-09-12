import Link from "next/link";
import { SectionHeader } from "@/components/section-header";

export default function ClubPage() {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <Link href="/explorar" className="text-wine-700 text-sm font-semibold">
          ← Explorar
        </Link>
      </header>
      <div className="mx-auto max-w-5xl py-16 sm:py-24">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.25em] uppercase">
          O Clube Ribatejo
        </p>
        <h1 className="font-display mt-5 max-w-3xl text-5xl tracking-tight text-olive-900 sm:text-7xl">
          Descubra mais. Aproveite melhor.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-olive-700">
          Uma adesão anual para quem gosta de conhecer a região e ter acesso a
          benefícios exclusivos em lugares selecionados.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/registar"
            className="bg-wine-700 inline-flex min-h-11 items-center rounded-full px-6 py-3 text-sm font-semibold text-white"
          >
            Quero ser membro
          </Link>
          <Link
            href="/explorar"
            className="inline-flex min-h-11 items-center rounded-full border border-olive-900/20 px-6 py-3 text-sm font-semibold text-olive-900"
          >
            Explorar gratuitamente
          </Link>
        </div>
        <section className="mt-20 grid gap-10 md:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Como funciona"
              title="Um benefício simples, em lugares reais."
            />
            <ol className="mt-8 space-y-6">
              {[
                "Torna-te membro do Clube",
                "Descobre parceiros no guia",
                "Escolhe o benefício disponível",
                "Apresenta-o no estabelecimento e aproveita",
              ].map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="bg-gold-500 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold text-olive-900">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-6 text-olive-700">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="border-gold-500/40 bg-gold-500/10 rounded-3xl border p-8">
            <p className="text-wine-700 text-xs font-semibold tracking-[0.2em] uppercase">
              Adesão
            </p>
            <p className="font-display mt-4 text-4xl text-olive-900">
              12 meses
            </p>
            <p className="mt-4 text-sm leading-6 text-olive-700">
              A validade e o preço final serão apresentados quando a subscrição
              estiver disponível.
            </p>
            <p className="mt-6 text-sm font-semibold text-olive-900">
              Sem pagamentos ou reservas nesta versão demo.
            </p>
          </div>
        </section>
        <section className="mt-20">
          <SectionHeader
            eyebrow="Perguntas frequentes"
            title="Tudo claro antes de aderir."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              [
                "O que inclui o Clube?",
                "Acesso a benefícios definidos com parceiros locais e uma experiência de descoberta mais completa.",
              ],
              [
                "Posso explorar sem ser membro?",
                "Sim. O guia é aberto a todos; a adesão desbloqueia os benefícios exclusivos.",
              ],
              [
                "Durante quanto tempo é válido?",
                "A subscrição terá validade de 12 meses.",
              ],
              [
                "Como são validados os benefícios?",
                "A validação será controlada pelo estabelecimento e pela API do Clube, numa fase futura.",
              ],
            ].map(([question, answer]) => (
              <article
                key={question}
                className="bg-cream-100 rounded-2xl border border-olive-900/10 p-6"
              >
                <h2 className="font-display text-xl text-olive-900">
                  {question}
                </h2>
                <p className="mt-3 text-sm leading-6 text-olive-700">
                  {answer}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
