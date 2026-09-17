"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const fallback = [
  {
    id: "demo",
    title: "10% de desconto para membros",
    description: "Uma vantagem exclusiva para membros Clube Daqui.",
    type: "Desconto",
    business: { name: "A Tasca do Bronze", slug: "a-tasca-do-bronze" },
  },
];
export default function OffersPage() {
  const [offers, setOffers] = useState(fallback);
  const [filter, setFilter] = useState("Todos");
  useEffect(() => {
    fetch("/api/benefits")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.data?.length)
          setOffers(
            p.data.map(
              (x: {
                id: string;
                title: string;
                description: string;
                type: string;
                businesses: { name: string; slug: string };
              }) => ({
                ...x,
                type: x.type.replaceAll("_", " "),
                business: x.businesses,
              }),
            ),
          );
      })
      .catch(() => undefined);
  }, []);
  const visible = offers.filter(
    (offer) =>
      filter === "Todos" ||
      (offer.business?.name === "A Tasca do Bronze"
        ? filter === "Comer"
        : true),
  );
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-7xl justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-olive-900"
        >
          Clube Daqui
        </Link>
        <Link href="/conta" className="text-wine-700 text-sm font-semibold">
          Minha conta
        </Link>
      </header>
      <section className="mx-auto max-w-7xl py-20">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Benefícios em Almeirim
        </p>
        <h1 className="font-display mt-5 text-5xl tracking-tight text-olive-900 sm:text-7xl">
          Benefícios para aproveitar a região.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-olive-700">
          Consulte as condições de cada parceiro e descubra as vantagens
          reservadas aos membros.
        </p>
        <div className="mt-10 flex flex-wrap gap-2">
          {["Todos", "Comer", "Dormir", "Lazer"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${filter === item ? "bg-olive-900 text-white" : "border border-olive-900/15 text-olive-700"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((offer) => (
            <article
              key={offer.id}
              className="bg-cream-100 rounded-3xl border border-olive-900/10 p-7"
            >
              <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
                {offer.type}
              </p>
              <h2 className="font-display mt-10 text-2xl text-olive-900">
                {offer.title}
              </h2>
              <p className="text-wine-700 mt-3 text-sm font-semibold">
                {offer.business?.name}
              </p>
              <p className="mt-5 text-sm leading-6 text-olive-700">
                {offer.description}
              </p>
              <Link
                href={`/explorar/${offer.business?.slug}`}
                className="text-wine-700 decoration-gold-500 mt-7 inline-block text-sm font-semibold underline underline-offset-4"
              >
                Ver parceiro →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
