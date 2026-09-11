"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function PartnersPage() {
  const [status, setStatus] = useState("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiUrl}/api/partner-inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.get("businessName"),
          contactName: form.get("contactName"),
          contact: form.get("contact"),
        }),
      });
      if (!response.ok) throw new Error();
      setStatus("success");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <Link href="/" className="text-wine-700 text-sm font-semibold">
          ← Voltar à Home
        </Link>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 py-20 lg:grid-cols-[1fr_0.8fr] lg:py-28">
        <div>
          <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
            Para estabelecimentos locais
          </p>
          <h1 className="font-display mt-6 text-5xl tracking-tight text-olive-900 sm:text-7xl">
            Faça parte do próximo capítulo do Ribatejo.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-olive-700">
            Estamos a reunir os primeiros parceiros de Almeirim para criar
            benefícios reais, atrair novos clientes e dar mais visibilidade ao
            que é nosso.
          </p>
          <div className="mt-10 space-y-4 text-sm text-olive-700">
            <p>✓ Presença no guia local</p>
            <p>✓ Benefício exclusivo para membros</p>
            <p>✓ Relação direta com a comunidade</p>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="text-cream-50 rounded-3xl bg-olive-900 p-8 sm:p-10"
        >
          <h2 className="font-display text-3xl">
            Queremos conhecer o seu negócio.
          </h2>
          <p className="text-cream-100/70 mt-3 text-sm">
            Deixe os seus dados e entraremos em contacto.
          </p>
          <label className="mt-8 block text-sm">
            Nome do estabelecimento
            <input
              name="businessName"
              className="bg-cream-50 mt-2 w-full rounded-xl px-4 py-3 text-olive-900 outline-none"
              required
            />
          </label>
          <label className="mt-5 block text-sm">
            Nome de contacto
            <input
              name="contactName"
              className="bg-cream-50 mt-2 w-full rounded-xl px-4 py-3 text-olive-900 outline-none"
              required
            />
          </label>
          <label className="mt-5 block text-sm">
            Email ou telefone
            <input
              name="contact"
              className="bg-cream-50 mt-2 w-full rounded-xl px-4 py-3 text-olive-900 outline-none"
              required
            />
          </label>
          {status === "success" && (
            <p className="text-gold-500 mt-5 text-sm">
              Pedido enviado. Entraremos em contacto.
            </p>
          )}
          {status === "error" && (
            <p className="mt-5 text-sm text-red-200">
              Não foi possível enviar. Tente novamente.
            </p>
          )}
          <button
            disabled={status === "sending"}
            type="submit"
            className="bg-gold-500 mt-7 rounded-full px-6 py-3 text-sm font-semibold text-olive-900"
          >
            {status === "sending" ? "A enviar…" : "Quero ser contactado"}
          </button>
        </form>
      </section>
    </main>
  );
}
