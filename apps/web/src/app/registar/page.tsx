"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const passwordConfirmation = String(form.get("passwordConfirmation") ?? "");

    if (fullName.length < 2) {
      setError("Introduza o seu nome completo.");
      return;
    }
    if (password.length < 8) {
      setError("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: authError } = await createClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(
          authError.message.toLowerCase().includes("password")
            ? "A palavra-passe não cumpre os requisitos de segurança."
            : "Não foi possível criar a conta. Tente novamente.",
        );
        return;
      }

      if (data.session) {
        router.replace("/conta?welcome=1");
        router.refresh();
        return;
      }

      setSent(true);
    } catch {
      setError(
        "Não foi possível contactar o serviço de autenticação. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
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
        <Link href="/entrar" className="text-wine-700 text-sm font-semibold">
          Já tenho conta
        </Link>
      </header>

      <section className="mx-auto max-w-xl py-16 sm:py-24">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Adesão ao Clube
        </p>
        <h1 className="font-display mt-5 text-5xl tracking-tight text-olive-900 sm:text-6xl">
          Crie a sua conta.
        </h1>
        <p className="mt-6 text-lg leading-8 text-olive-700">
          Confirme o seu email para entrar na área de membro e acompanhar os
          seus benefícios.
        </p>

        {sent ? (
          <div className="text-cream-50 mt-10 rounded-3xl bg-olive-900 p-8">
            <p className="text-gold-500 text-xs font-semibold tracking-[0.2em] uppercase">
              Falta um passo
            </p>
            <h2 className="font-display mt-4 text-3xl">
              Confirme o seu email.
            </h2>
            <p className="text-cream-100/75 mt-4 text-sm leading-6">
              Enviámos uma mensagem para <strong>{email}</strong>. Abra o link
              no mesmo dispositivo para confirmar a conta e entrar na sua área
              de membro.
            </p>
            <p className="text-cream-100/55 mt-4 text-xs leading-5">
              Se não encontrar a mensagem, verifique a pasta de spam. Por
              segurança, não indicamos se este email já estava registado.
            </p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="bg-cream-100 mt-10 rounded-3xl border border-olive-900/10 p-8"
          >
            <label className="block text-sm font-semibold text-olive-900">
              Nome completo
              <input
                name="fullName"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
                required
              />
            </label>
            <label className="mt-5 block text-sm font-semibold text-olive-900">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
                required
              />
            </label>
            <label className="mt-5 block text-sm font-semibold text-olive-900">
              Palavra-passe
              <input
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
                required
              />
              <span className="mt-2 block text-xs font-normal text-olive-600">
                Utilize pelo menos 8 caracteres.
              </span>
            </label>
            <label className="mt-5 block text-sm font-semibold text-olive-900">
              Confirmar palavra-passe
              <input
                name="passwordConfirmation"
                type="password"
                minLength={8}
                autoComplete="new-password"
                className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
                required
              />
            </label>
            {error ? (
              <p role="alert" className="text-wine-700 mt-5 text-sm">
                {error}
              </p>
            ) : null}
            <button
              disabled={submitting}
              className="bg-wine-700 mt-7 min-h-11 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "A criar conta…" : "Criar conta"}
            </button>
            <p className="mt-5 text-xs leading-5 text-olive-600">
              Ao criar a conta, aceita receber o email necessário para confirmar
              o endereço e aceder ao Clube.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
