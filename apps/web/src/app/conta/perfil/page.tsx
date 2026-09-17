"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/app-header";
import { validateNIF } from "@/lib/nif";

type ProfileData = {
  fullName: string | null;
  phone: string | null;
  nif: string | null;
  email: string | null;
};

const inputClass =
  "w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10";
const labelClass = "mb-1.5 block text-xs font-semibold text-olive-900";

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Personal data form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nif, setNif] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);

  // Email change
  const [emailInput, setEmailInput] = useState("");
  const [emailMsg, setEmailMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Password change
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(
    null,
  );
  const [savingPw, setSavingPw] = useState(false);

  const initialised = useRef(false);

  useEffect(() => {
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/entrar");
        return;
      }
      const res = await fetch("/api/me/profile");
      if (res.ok) {
        const json = (await res.json()) as { data?: ProfileData };
        if (json.data) {
          setProfile(json.data);
          if (!initialised.current) {
            setName(json.data.fullName ?? "");
            setPhone(json.data.phone ?? "");
            setNif(json.data.nif ?? "");
            initialised.current = true;
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  const nifLocked = Boolean(profile?.nif);

  async function saveProfile() {
    if (!nifLocked && nif && !validateNIF(nif)) {
      setProfileMsg({
        text: "NIF inválido. Verifique os 9 dígitos.",
        ok: false,
      });
      return;
    }
    setSaving(true);
    setProfileMsg(null);
    const body: Record<string, string> = {};
    if (name !== (profile?.fullName ?? "")) body.fullName = name;
    if (phone !== (profile?.phone ?? "")) body.phone = phone;
    if (!nifLocked && nif && nif !== (profile?.nif ?? "")) body.nif = nif;
    if (Object.keys(body).length === 0) {
      setSaving(false);
      setProfileMsg({ text: "Sem alterações para guardar.", ok: true });
      return;
    }
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string };
    if (json.error) {
      setProfileMsg({ text: json.error, ok: false });
    } else {
      setProfileMsg({ text: "Dados guardados com sucesso.", ok: true });
      setProfile((p) =>
        p
          ? { ...p, fullName: name, phone: phone || null, nif: nif || null }
          : p,
      );
    }
    setSaving(false);
  }

  async function changeEmail() {
    if (!emailInput.trim()) return;
    setSendingEmail(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({
      email: emailInput.trim(),
    });
    if (error) {
      setEmailMsg({ text: error.message, ok: false });
    } else {
      setEmailMsg({
        text: "Confirme o novo email — enviámos um link para ambos os endereços.",
        ok: true,
      });
      setEmailInput("");
    }
    setSendingEmail(false);
  }

  async function changePassword() {
    if (newPw.length < 8) {
      setPwMsg({ text: "Mínimo 8 caracteres.", ok: false });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: "As palavras-passe não coincidem.", ok: false });
      return;
    }
    setSavingPw(true);
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      setPwMsg({
        text: "Não foi possível alterar. Tente terminar sessão e entrar novamente.",
        ok: false,
      });
    } else {
      setPwMsg({ text: "Palavra-passe alterada com sucesso.", ok: true });
      setNewPw("");
      setConfirmPw("");
    }
    setSavingPw(false);
  }

  const logoutButton = (
    <form action="/auth/logout" method="POST">
      <button
        type="submit"
        className="min-h-[44px] rounded-full border border-olive-900/15 px-4 py-2 text-sm font-semibold text-olive-700 transition hover:bg-olive-900/5"
      >
        Sair
      </button>
    </form>
  );

  return (
    <main className="bg-cream-50 min-h-screen">
      <AppHeader rightSlot={logoutButton} mobileRight={logoutButton} />

      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Back + title */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/conta"
            className="hover:bg-cream-100 flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-olive-900/15 text-olive-600"
          >
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-olive-900">Minha conta</h1>
            <p className="text-sm text-olive-500">
              Dados pessoais e credenciais de acesso
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[72, 48, 48].map((h, i) => (
              <div
                key={i}
                style={{ height: h }}
                className="animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Personal data */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-sm font-bold text-olive-900">
                Dados pessoais
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nome completo</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="O seu nome"
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    className={inputClass}
                    placeholder="+351 9XX XXX XXX"
                  />
                </div>
                <div>
                  <label className={labelClass}>NIF</label>
                  {nifLocked ? (
                    <div className="flex items-center gap-3">
                      <span
                        className={`${inputClass} bg-cream-50 cursor-not-allowed font-mono tracking-widest text-olive-500`}
                      >
                        {profile?.nif}
                      </span>
                      <span className="shrink-0 text-xs text-olive-400">
                        Não editável
                      </span>
                    </div>
                  ) : (
                    <>
                      <input
                        value={nif}
                        onChange={(e) =>
                          setNif(e.target.value.replace(/\D/g, "").slice(0, 9))
                        }
                        inputMode="numeric"
                        maxLength={9}
                        className={`${inputClass} font-mono tracking-widest`}
                        placeholder="123456789"
                      />
                      <p className="mt-1 text-xs text-olive-400">
                        Após guardar, o NIF não poderá ser alterado.
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Email actual</label>
                  <span
                    className={`${inputClass} bg-cream-50 block cursor-not-allowed text-olive-500`}
                  >
                    {profile?.email ?? "—"}
                  </span>
                </div>
              </div>

              {profileMsg && (
                <p
                  className={`mt-4 text-sm ${profileMsg.ok ? "text-olive-700" : "text-wine-700"}`}
                >
                  {profileMsg.text}
                </p>
              )}
              <div className="mt-5">
                <button
                  onClick={() => void saveProfile()}
                  disabled={saving}
                  className="rounded-xl bg-olive-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 disabled:opacity-60"
                >
                  {saving ? "A guardar…" : "Guardar alterações"}
                </button>
              </div>
            </div>

            {/* Change email */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-sm font-bold text-olive-900">
                Alterar email
              </h2>
              <p className="mb-4 text-xs text-olive-500">
                Será enviado um link de confirmação para o novo endereço e para
                o actual.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="novo@email.pt"
                  className={`${inputClass} flex-1`}
                />
                <button
                  onClick={() => void changeEmail()}
                  disabled={sendingEmail || !emailInput.trim()}
                  className="shrink-0 rounded-xl bg-olive-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 disabled:opacity-60"
                >
                  {sendingEmail ? "A enviar…" : "Confirmar"}
                </button>
              </div>
              {emailMsg && (
                <p
                  className={`mt-3 text-sm ${emailMsg.ok ? "text-olive-700" : "text-wine-700"}`}
                >
                  {emailMsg.text}
                </p>
              )}
            </div>

            {/* Change password */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-olive-900">
                Alterar palavra-passe
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nova palavra-passe</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    minLength={8}
                    placeholder="Mín. 8 caracteres"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirmar palavra-passe</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Repita a nova palavra-passe"
                    className={inputClass}
                  />
                </div>
              </div>
              {pwMsg && (
                <p
                  className={`mt-3 text-sm ${pwMsg.ok ? "text-olive-700" : "text-wine-700"}`}
                >
                  {pwMsg.text}
                </p>
              )}
              <div className="mt-5">
                <button
                  onClick={() => void changePassword()}
                  disabled={savingPw}
                  className="rounded-xl bg-olive-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 disabled:opacity-60"
                >
                  {savingPw ? "A alterar…" : "Alterar palavra-passe"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
