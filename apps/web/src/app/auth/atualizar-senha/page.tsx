"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await createClient().auth.updateUser({ password });
    if (err) {
      setError("Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo em /entrar.");
      setSubmitting(false);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/conta"), 2000);
  }

  return (
    <main className="flex min-h-screen flex-col bg-cream-50">
      <header className="flex items-center px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display text-[1.2rem] font-semibold tracking-tight text-olive-900"
        >
          Clube Ribatejo
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-5 pt-8 pb-10 sm:px-8 sm:pt-16">
        <div className="w-full max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-wine-700">
            Segurança
          </p>
          <h1 className="font-display mt-3 text-[2.4rem] leading-tight tracking-tight text-olive-900 sm:text-5xl">
            Nova senha.
          </h1>
          <p className="mt-3 text-sm leading-6 text-olive-700">
            Defina uma nova senha para a sua conta.
          </p>

          {done ? (
            <div className="mt-8 rounded-2xl bg-olive-900/8 px-6 py-8 text-center">
              <p className="text-lg font-semibold text-olive-900">
                Senha atualizada!
              </p>
              <p className="mt-1 text-sm text-olive-600">
                A redirecionar para a área de membros…
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => void submit(e)}
              className="mt-8 space-y-5 rounded-2xl bg-cream-100 p-6 sm:p-8"
            >
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-olive-900"
                >
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:border-wine-700 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="block text-sm font-semibold text-olive-900"
                >
                  Confirmar senha
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="Repita a senha"
                  className="mt-2 block w-full rounded-xl border border-olive-900/12 bg-white px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:border-wine-700 focus:outline-none"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-wine-700/8 px-4 py-3 text-sm text-wine-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="block min-h-[48px] w-full rounded-full bg-wine-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-wine-800 disabled:opacity-60"
              >
                {submitting ? "A guardar…" : "Definir nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}