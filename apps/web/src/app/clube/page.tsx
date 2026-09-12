import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { SectionHeader } from "@/components/section-header";

export default function ClubPage() {
  return (
    <main className="min-h-screen">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-20">
        <p className="text-wine-700 text-[11px] font-semibold tracking-[0.28em] uppercase">
          O Clube Ribatejo
        </p>
        <h1 className="font-display mt-4 max-w-2xl text-[2.6rem] leading-tight tracking-tight text-olive-900 sm:text-6xl lg:text-7xl">
          Descubra mais. Aproveite melhor.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-olive-700 sm:text-lg sm:leading-8">
          Uma adesão anual para quem gosta de conhecer a região e ter acesso a
          benefícios exclusivos em lugares selecionados.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/registar"
            className="bg-wine-700 hover:bg-wine-800 inline-flex min-h-[48px] items-center rounded-full px-7 py-3 text-sm font-semibold text-white transition"
          >
            Quero ser membro
          </Link>
          <Link
            href="/explorar"
            className="inline-flex min-h-[48px] items-center rounded-full border border-olive-900/20 px-7 py-3 text-sm font-semibold text-olive-900 transition hover:bg-olive-900/5"
          >
            Explorar gratuitamente
          </Link>
        </div>

        {/* How it works + Pricing */}
        <section className="mt-16 grid gap-8 sm:mt-20 md:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Como funciona"
              title="Um benefício simples, em lugares reais."
            />
            <ol className="mt-8 space-y-5">
              {[
                "Torna-te membro do Clube",
                "Descobre parceiros no guia",
                "Escolhe o benefício disponível",
                "Apresenta-o no estabelecimento e aproveita",
              ].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="bg-gold-500 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold text-olive-900">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-sm leading-6 text-olive-700">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-gold-500/30 bg-gold-500/8 rounded-2xl border p-7 sm:p-8">
            <p className="text-wine-700 text-[11px] font-semibold tracking-[0.22em] uppercase">
              Adesão
            </p>
            <p className="font-display mt-4 text-[2.6rem] leading-none text-olive-900">
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

        {/* FAQ */}
        <section className="mt-16 sm:mt-20">
          <SectionHeader
            eyebrow="Perguntas frequentes"
            title="Tudo claro antes de aderir."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
                "A subscrição terá validade de 12 meses a partir da data de adesão.",
              ],
              [
                "Como são validados os benefícios?",
                "A validação é controlada pelo estabelecimento e confirmada pela plataforma do Clube.",
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
