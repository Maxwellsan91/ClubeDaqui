"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/app-header";

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
      setError(
        "Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo em /entrar.",
      );
      setSubmitting(false);
      return;
    }
    setDone(true);
    // Redirect admins to the admin area, regular users to /conta
    const { data: profile } = await createClient()
      .from("profiles")
      .select("role")
      .single();
    const dest = profile?.role === "ADMIN" ? "/admin" : "/conta";
    setTimeout(() => router.replace(dest), 1500);
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-lg px-5 py-10 sm:py-16">
        <h1 className="font-display text-2xl font-bold text-olive-900">
          Definir nova senha
        </h1>
        <p className="mt-2 text-sm text-olive-600">
          Escolha uma nova senha para a sua conta do Clube Ribatejo.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl bg-olive-900/8 px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-olive-700/10 text-xl text-olive-700">
              ✓
            </div>
            <p className="font-semibold text-olive-900">Senha atualizada!</p>
            <p className="mt-1 text-sm text-olive-600">
              A redirecionar para a área de membros…
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => void submit(e)}
            className="mt-8 space-y-5 rounded-2xl border border-olive-900/8 bg-white p-6 shadow-sm"
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
                className="bg-cream-50 mt-2 block w-full rounded-xl border border-olive-900/12 px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:border-olive-700 focus:bg-white focus:outline-none"
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
                className="bg-cream-50 mt-2 block w-full rounded-xl border border-olive-900/12 px-4 py-3 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:border-olive-700 focus:bg-white focus:outline-none"
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
              className="block min-h-[48px] w-full rounded-full bg-olive-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-900/90 disabled:opacity-60"
            >
              {submitting ? "A guardar…" : "Guardar nova senha"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
