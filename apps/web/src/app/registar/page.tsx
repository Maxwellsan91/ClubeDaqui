"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
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
          data: {
            full_name: fullName,
            ...(referralCode.trim() && {
              referral_code: referralCode.trim().toUpperCase(),
            }),
          },
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
      setError("Não foi possível contactar o serviço. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-cream-50 flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-[1.2rem] font-semibold tracking-tight text-olive-900"
        >
          Clube Ribatejo
        </Link>
        <Link
          href="/entrar"
          className="text-wine-700 hover:text-wine-800 text-sm font-semibold transition-colors"
        >
          Já tenho conta
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-5 pt-8 pb-10 sm:px-8 sm:pt-14">
        <div className="w-full max-w-md">
          {sent ? (
            /* Confirmation state */
            <div className="text-cream-50 rounded-2xl bg-olive-900 p-7 sm:p-10">
              <p className="text-gold-500 text-[11px] font-semibold tracking-[0.25em] uppercase">
                Falta um passo
              </p>
              <h2 className="font-display mt-4 text-[1.9rem] leading-tight">
                Confirme o seu email.
              </h2>
              <p className="text-cream-100/75 mt-4 text-sm leading-6">
                Enviámos uma mensagem para{" "}
                <strong className="text-cream-50">{email}</strong>. Abra o link
                para confirmar a conta e aceder à sua área de membro.
              </p>
              <p className="text-cream-100/45 mt-4 text-xs leading-5">
                Não encontra o email? Verifique a pasta de spam. Por segurança,
                não indicamos se este endereço já estava registado.
              </p>
            </div>
          ) : (
            <>
              <p className="text-wine-700 text-[11px] font-semibold tracking-[0.28em] uppercase">
                Adesão ao Clube
              </p>
              <h1 className="font-display mt-3 text-[2.4rem] leading-tight tracking-tight text-olive-900 sm:text-5xl">
                Crie a sua conta.
              </h1>
              <p className="mt-3 text-sm leading-6 text-olive-700">
                Já tem conta?{" "}
                <Link
                  href="/entrar"
                  className="text-wine-700 hover:decoration-wine-700 font-semibold underline decoration-transparent underline-offset-4 transition-all"
                >
                  Entrar
                </Link>
              </p>

              <form
                onSubmit={submit}
                className="bg-cream-100 mt-7 space-y-5 rounded-2xl p-6 sm:p-8"
              >
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-semibold text-olive-900"
                  >
                    Nome completo
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    minLength={2}
                    maxLength={120}
                    className="focus:border-wine-700 mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
                    placeholder="Ana Silva"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-olive-900"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="focus:border-wine-700 mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
                    placeholder="a.sua@email.pt"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-olive-900"
                  >
                    Palavra-passe
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    className="focus:border-wine-700 mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
                    placeholder="Mín. 8 caracteres"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="passwordConfirmation"
                    className="block text-sm font-semibold text-olive-900"
                  >
                    Confirmar palavra-passe
                  </label>
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    className="focus:border-wine-700 mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
                    placeholder="Repita a palavra-passe"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="referralCode"
                    className="block text-sm font-semibold text-olive-900"
                  >
                    Código de referência{" "}
                    <span className="font-normal text-olive-500">(opcional)</span>
                  </label>
                  <input
                    id="referralCode"
                    name="referralCode"
                    value={referralCode}
                    onChange={(e) =>
                      setReferralCode(e.target.value.toUpperCase())
                    }
                    autoComplete="off"
                    className="focus:border-wine-700 mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 font-mono text-olive-900 transition-colors placeholder:font-sans placeholder:text-olive-700/40 focus:outline-none"
                    placeholder="Ex: JOAO-1234"
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="bg-wine-700/8 text-wine-700 rounded-xl px-4 py-3 text-sm"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-wine-700 hover:bg-wine-800 block min-h-[48px] w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                >
                  {submitting ? "A criar conta…" : "Criar conta"}
                </button>

                <p className="text-xs leading-5 text-olive-600">
                  Ao criar a conta, aceita receber o email de confirmação
                  necessário para aceder ao Clube.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
