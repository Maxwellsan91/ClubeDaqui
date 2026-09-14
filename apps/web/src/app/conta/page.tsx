"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppHeader } from "@/components/app-header";
import type { BusinessCardData } from "@/components/business-card";
import { RecordSavingsForm } from "@/components/record-savings-form";
import { SavingsByCategory } from "@/components/savings-by-category";
import { SavingsHistory } from "@/components/savings-history";
import { SavingsOverview } from "@/components/savings-overview";
import type {
  MemberRedemption,
  MemberSummaryData,
  SavingsRecord,
} from "@/types/member";
import { validateNIF } from "@/lib/nif";

const staticPlaces: BusinessCardData[] = [
  {
    slug: "a-tasca-do-bronze",
    name: "A Tasca do Bronze",
    category: "Comer",
    kind: "Restaurante",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
    cuisine: "Tradicional portuguesa",
  },
  {
    slug: "a-adega",
    name: "A Adega",
    category: "Comer",
    kind: "Restaurante",
    city: "Fazendas de Almeirim",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
    cuisine: "Cozinha portuguesa",
  },
  {
    slug: "adega-novo-conceito",
    name: "Adega Novo Conceito",
    category: "Comer",
    kind: "Adega",
    city: "Fazendas de Almeirim",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "experiências-do-tejo",
    name: "Experiências do Tejo",
    category: "Lazer",
    kind: "Experiência",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80",
  },
  {
    slug: "casa-ribatejana",
    name: "Casa Ribatejana",
    category: "Dormir",
    kind: "Alojamento",
    city: "Almeirim",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
];

type ProfileData = {
  fullName: string | null;
  phone: string | null;
  nif: string | null;
  email: string | null;
};

function ProfileEditSection({
  profile,
  apiUrl,
  onSaved,
}: {
  profile: ProfileData | null;
  apiUrl: string;
  onSaved: (updated: Partial<ProfileData>) => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [nif, setNif] = useState(profile?.nif ?? "");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [savingPw, setSavingPw] = useState(false);
  const initialised = useRef(false);

  useEffect(() => {
    if (profile && !initialised.current) {
      setName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
      setNif(profile.nif ?? "");
      initialised.current = true;
    }
  }, [profile]);

  const nifLocked = Boolean(profile?.nif);

  async function saveProfile() {
    if (!nifLocked && nif && !validateNIF(nif)) {
      setProfileMsg({ text: "NIF inválido. Verifique os 9 dígitos.", ok: false });
      return;
    }
    setSaving(true);
    setProfileMsg(null);
    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token ?? "";
    const body: Record<string, string> = {};
    if (name !== (profile?.fullName ?? "")) body.fullName = name;
    if (phone !== (profile?.phone ?? "")) body.phone = phone;
    if (!nifLocked && nif && nif !== (profile?.nif ?? "")) body.nif = nif;
    if (Object.keys(body).length === 0) {
      setSaving(false);
      setProfileMsg({ text: "Sem alterações para guardar.", ok: true });
      return;
    }
    const res = await fetch(`${apiUrl}/api/me/profile`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { error?: string; data?: Partial<ProfileData> };
    if (json.error) {
      setProfileMsg({ text: json.error, ok: false });
    } else {
      setProfileMsg({ text: "Dados guardados com sucesso.", ok: true });
      onSaved({ fullName: name, phone: phone || null, nif: nif || null });
    }
    setSaving(false);
  }

  async function changeEmail() {
    if (!emailInput.trim()) return;
    setSendingEmail(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: emailInput.trim() });
    if (error) {
      setEmailMsg({ text: error.message, ok: false });
    } else {
      setEmailMsg({ text: "Confirme o novo email — enviámos um link para ambos os endereços.", ok: true });
      setEmailInput("");
    }
    setSendingEmail(false);
  }

  async function changePassword() {
    if (newPw.length < 8) { setPwMsg({ text: "Mínimo 8 caracteres.", ok: false }); return; }
    if (newPw !== confirmPw) { setPwMsg({ text: "As palavras-passe não coincidem.", ok: false }); return; }
    setSavingPw(true);
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      setPwMsg({ text: "Não foi possível alterar. Tente terminar sessão e entrar novamente.", ok: false });
    } else {
      setPwMsg({ text: "Palavra-passe alterada com sucesso.", ok: true });
      setNewPw(""); setConfirmPw("");
    }
    setSavingPw(false);
  }

  if (!profile) return null;

  const inputClass = "w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10";
  const labelClass = "mb-1.5 block text-xs font-semibold text-olive-900";

  return (
    <div className="mt-16 border-t border-cream-100 pt-12">
      <h2 className="font-display text-2xl text-olive-900">O meu perfil</h2>
      <p className="mt-1 text-sm text-olive-600">Actualize os seus dados pessoais e credenciais de acesso.</p>

      {/* Personal data */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-olive-900 mb-5">Dados pessoais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nome completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={inputClass} placeholder="+351 9XX XXX XXX" />
          </div>
          <div>
            <label className={labelClass}>NIF</label>
            {nifLocked ? (
              <div className="flex items-center gap-3">
                <span className={`${inputClass} bg-cream-50 text-olive-500 font-mono tracking-widest cursor-not-allowed`}>
                  {profile.nif}
                </span>
                <span className="shrink-0 text-xs text-olive-400">Não editável</span>
              </div>
            ) : (
              <>
                <input
                  value={nif}
                  onChange={(e) => setNif(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  inputMode="numeric"
                  maxLength={9}
                  className={`${inputClass} font-mono tracking-widest`}
                  placeholder="123456789"
                />
                <p className="mt-1 text-xs text-olive-400">Após guardar, o NIF não poderá ser alterado.</p>
              </>
            )}
          </div>
          <div>
            <label className={labelClass}>Email actual</label>
            <span className={`${inputClass} block bg-cream-50 text-olive-500 cursor-not-allowed`}>
              {profile.email ?? "—"}
            </span>
          </div>
        </div>
        {profileMsg && (
          <p className={`mt-4 text-sm ${profileMsg.ok ? "text-olive-700" : "text-wine-700"}`}>{profileMsg.text}</p>
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
      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-olive-900 mb-1">Alterar email</h3>
        <p className="text-xs text-olive-500 mb-4">Será enviado um link de confirmação para o novo endereço e para o actual.</p>
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
          <p className={`mt-3 text-sm ${emailMsg.ok ? "text-olive-700" : "text-wine-700"}`}>{emailMsg.text}</p>
        )}
      </div>

      {/* Change password */}
      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-olive-900 mb-4">Alterar palavra-passe</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nova palavra-passe</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} minLength={8} placeholder="Mín. 8 caracteres" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Confirmar palavra-passe</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repita a nova palavra-passe" className={inputClass} />
          </div>
        </div>
        {pwMsg && (
          <p className={`mt-3 text-sm ${pwMsg.ok ? "text-olive-700" : "text-wine-700"}`}>{pwMsg.text}</p>
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
  );
}

const storageKey = "clube-ribatejo-savings";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function AccountPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState<string>();
  const [showMap, setShowMap] = useState(false);
  const [places, setPlaces] = useState<BusinessCardData[]>(staticPlaces);
  const [records, setRecords] = useState<SavingsRecord[]>([]);
  const [serverSummary, setServerSummary] = useState<MemberSummaryData | null>(
    null,
  );
  const [unrecordedRedemptions, setUnrecordedRedemptions] = useState<
    MemberRedemption[]
  >([]);
  const [apiStatus, setApiStatus] = useState<
    "loading" | "connected" | "fallback"
  >("loading");
  const [profile, setProfile] = useState<{
    fullName: string | null;
    phone: string | null;
    nif: string | null;
    email: string | null;
  } | null>(null);

  const [influencerData, setInfluencerData] = useState<{
    uniqueCode: string;
    commissionRate: number;
    totalReferrals: number;
    totalValidated: number;
    totalPending: number;
    totalValidatedCommission: number;
    totalPendingCommission: number;
    monthly: {
      month: string;
      pending: number;
      validated: number;
      cancelled: number;
      validatedCommission: number;
      pendingCommission: number;
    }[];
  } | null>(null);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      const name: string | undefined =
        meta?.full_name || meta?.name || data.user?.email;
      setFirstName(name?.split(/[\s@]/)[0]);
    });
    if (apiUrl) {
      fetch(`${apiUrl}/api/businesses`)
        .then((r) => (r.ok ? r.json() : null))
        .then((payload) => {
          if (payload?.data?.length) {
            setPlaces(
              payload.data.map(
                (item: {
                  slug: string;
                  name: string;
                  category: string;
                  kind: string;
                  city: string;
                  imageUrl?: string;
                }) => ({
                  slug: item.slug,
                  name: item.name,
                  category: item.category,
                  kind: item.kind,
                  city: item.city,
                  image:
                    item.imageUrl ??
                    staticPlaces.find((p) => p.name === item.name)?.image ??
                    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
                }),
              ),
            );
          }
        })
        .catch(() => {});
    }
    client.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token || !apiUrl) {
        setApiStatus("fallback");
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        // Se for o primeiro login após registo, registar referral se existir
        if (searchParams.get("welcome") === "1") {
          void fetch(`${apiUrl}/api/me/referral`, {
            method: "POST",
            headers,
          });
        }
        const [summaryResponse, savingsResponse, redemptionsResponse, influencerResponse, profileResponse] =
          await Promise.all([
            fetch(`${apiUrl}/api/me/summary`, { headers }),
            fetch(`${apiUrl}/api/me/savings`, { headers }),
            fetch(`${apiUrl}/api/me/redemptions`, { headers }),
            fetch(`${apiUrl}/api/me/influencer`, { headers }),
            fetch(`${apiUrl}/api/me/profile`, { headers }),
          ]);
        if (profileResponse.ok) {
          const pp = (await profileResponse.json()) as { data?: typeof profile };
          if (pp.data) setProfile(pp.data);
        }
        if (
          !summaryResponse.ok ||
          !savingsResponse.ok ||
          !redemptionsResponse.ok
        ) {
          throw new Error("Member API unavailable");
        }
        if (influencerResponse.ok) {
          const infPayload = (await influencerResponse.json()) as {
            data?: typeof influencerData;
          };
          if (infPayload.data) setInfluencerData(infPayload.data);
        }
        const summaryPayload = (await summaryResponse.json()) as {
          data?: MemberSummaryData;
        };
        const savingsPayload = (await savingsResponse.json()) as {
          data?: { records?: SavingsRecord[] };
        };
        const redemptionsPayload = (await redemptionsResponse.json()) as {
          data?: MemberRedemption[];
        };
        if (summaryPayload.data) {
          setServerSummary(summaryPayload.data);
          if (summaryPayload.data.role === "ADMIN") {
            router.replace("/admin");
            return;
          }
        }
        setRecords(savingsPayload.data?.records ?? []);
        setUnrecordedRedemptions(
          (redemptionsPayload.data ?? []).filter((item) => !item.financial),
        );
        setApiStatus("connected");
      } catch {
        // Mantém o fallback local da demo se a API estiver indisponível.
        setApiStatus("fallback");
      }
    });
  }, []);

  const byCategory = useMemo(() => {
    const map: Record<string, BusinessCardData[]> = {};
    places.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return Object.entries(map);
  }, [places]);

  const saveServerRecord = (record: SavingsRecord) => {
    setRecords((current) => [record, ...current]);
    setUnrecordedRedemptions((current) =>
      current.filter((item) => item.id !== record.redemptionId),
    );
  };
  const summary = serverSummary ?? {
    subscriptionStatus: "active" as const,
    validUntil: null,
    usedBenefits: records.length,
    availableBenefits: 0,
    totalBenefits: records.length,
    potentialSavings: null,
  };

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
    <main className="min-h-screen">
      <AppHeader rightSlot={logoutButton} mobileRight={logoutButton} />
      {serverSummary?.role === "ADMIN" && (
        <a
          href="/admin"
          className="flex items-center justify-between gap-3 bg-olive-900 px-5 py-2.5 sm:px-8"
        >
          <div className="flex items-center gap-2.5 text-sm text-cream-50/80">
            <span className="rounded bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold text-olive-900 uppercase tracking-wide">
              Admin
            </span>
            Está na área de membros — ir para o painel de administração
          </div>
          <svg
            className="h-4 w-4 flex-none text-cream-50/60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </a>
      )}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-wine-700 text-xs font-semibold tracking-[0.28em] uppercase">
          Área de membros
        </p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[2rem] leading-tight tracking-tight text-olive-900 sm:text-5xl">
              Olá,{" "}
              {serverSummary?.fullName?.split(" ")[0] ?? firstName ?? "membro"}.
            </h1>
            <p className="mt-2 text-base leading-6 text-olive-700 sm:mt-4 sm:text-lg sm:leading-7">
              Descubra o próximo lugar e acompanhe as suas poupanças.
            </p>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="min-h-11 rounded-full bg-olive-900 px-5 py-3 text-sm font-semibold text-white"
          >
            {showMap ? "Ver lista" : "Ver mapa"}
          </button>
        </div>
        {/* Ações pendentes após visita — mostradas primeiro quando existem */}
        {apiStatus === "connected" && unrecordedRedemptions.length > 0 ? (
          <section className="mt-10">
            <div className="border-gold-500/30 bg-gold-500/8 rounded-2xl border p-5 sm:p-6">
              <p className="text-wine-700 text-[11px] font-bold tracking-[0.25em] uppercase">
                Após a visita
              </p>
              <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                {unrecordedRedemptions.length === 1
                  ? "Tem 1 benefício utilizado por completar."
                  : `Tem ${unrecordedRedemptions.length} benefícios utilizados por completar.`}
              </h2>
              <p className="mt-2 text-sm leading-6 text-olive-700">
                Registe o valor poupado e deixe uma avaliação para ajudar outros
                membros.
              </p>
            </div>
            <div className="mt-5 space-y-8">
              {unrecordedRedemptions.map((redemption) => (
                <div key={redemption.id}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-semibold text-olive-900">
                        {redemption.businessName}
                      </p>
                      <p className="text-sm text-olive-600">
                        {redemption.benefitTitle}
                      </p>
                    </div>
                    <p className="text-xs text-olive-600">
                      {new Intl.DateTimeFormat("pt-PT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(redemption.redeemedAt))}
                    </p>
                  </div>
                  <RecordSavingsForm
                    redemptionId={redemption.id}
                    businessName={redemption.businessName}
                    businessSlug={redemption.businessSlug}
                    onSaved={saveServerRecord}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Gráfico de economias */}
        <div className="mt-10">
          <SavingsOverview records={records} summary={summary} />
        </div>
        <div className="mt-6">
          <SavingsByCategory records={records} />
        </div>
        {apiStatus === "loading" ? (
          <p className="mt-10 text-sm text-olive-700">
            A carregar as suas utilizações…
          </p>
        ) : null}
        <div className="mt-10">
          <SavingsHistory records={records} />
        </div>
        <div className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-wine-700 text-xs font-semibold tracking-[0.2em] uppercase">
                Descobrir
              </p>
              <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                Lugares e benefícios
              </h2>
            </div>
            <Link
              href="/explorar"
              className="text-wine-700 shrink-0 text-sm font-semibold"
            >
              Ver todos →
            </Link>
          </div>

          {showMap ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-olive-900/10">
              <iframe
                title="Mapa de lugares no Ribatejo"
                className="h-[28rem] w-full"
                loading="lazy"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-8.67%2C39.14%2C-8.54%2C39.24&layer=mapnik&marker=39.2028%2C-8.6281"
              />
              <p className="p-4 text-xs text-olive-700">
                Mapa: © OpenStreetMap contributors.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {byCategory.map(([category, items]) => (
                <div key={category}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-xl text-olive-900 sm:text-2xl">
                      {category}
                    </h3>
                    <Link
                      href={`/explorar?categoria=${encodeURIComponent(category)}`}
                      className="text-wine-700 shrink-0 text-sm font-semibold"
                    >
                      {items.length} ofertas →
                    </Link>
                  </div>
                  <div className="-mx-5 flex [scrollbar-width:none] gap-3 overflow-x-auto px-5 pb-3 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                    {items.map((place) => (
                      <Link
                        key={place.slug}
                        href={`/explorar/${place.slug}`}
                        className="group w-40 flex-none overflow-hidden rounded-2xl border border-olive-900/10 bg-white shadow-sm transition hover:shadow-md"
                      >
                        <div
                          className="h-[100px] bg-cover bg-center"
                          style={{ backgroundImage: `url(${place.image})` }}
                          aria-label={`Imagem de ${place.name}`}
                        />
                        <div className="p-3">
                          <p className="text-gold-500 text-[10px] font-bold tracking-wider uppercase">
                            {place.kind}
                          </p>
                          <p className="group-hover:text-wine-700 mt-0.5 text-sm font-semibold leading-tight text-olive-900 transition-colors">
                            {place.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-olive-600">
                            {place.city}
                          </p>
                        </div>
                      </Link>
                    ))}
                    {/* Ver mais card */}
                    <Link
                      href={`/explorar?categoria=${encodeURIComponent(category)}`}
                      className="bg-cream-100 hover:bg-olive-900/5 flex w-32 flex-none flex-col items-center justify-center gap-2 rounded-2xl border border-olive-900/10 p-4 text-center transition"
                    >
                      <span className="text-xl text-olive-700/40">→</span>
                      <p className="text-[11px] font-semibold leading-tight text-olive-700">
                        Ver todos em {category}
                      </p>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Área de influencer ─────────────────────────────────────── */}
        {influencerData && (
          <div className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-wine-700 text-xs font-semibold tracking-[0.2em] uppercase">
                  Programa de referências
                </p>
                <h2 className="font-display mt-2 text-2xl text-olive-900 sm:text-3xl">
                  O seu dashboard de influencer
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-olive-900/12 bg-white px-4 py-2.5 shadow-sm">
                <span className="text-xs text-olive-500">Código</span>
                <span className="font-mono text-sm font-bold text-olive-900">
                  {influencerData.uniqueCode}
                </span>
                <button
                  onClick={() =>
                    void navigator.clipboard.writeText(influencerData.uniqueCode)
                  }
                  title="Copiar código"
                  className="ml-1 rounded p-0.5 text-olive-400 hover:text-olive-700 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Resumo */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Total de referências",
                  value: influencerData.totalReferrals,
                  suffix: "",
                },
                {
                  label: "Em carência",
                  value: influencerData.totalPending,
                  suffix: "",
                  sub: `${influencerData.totalPendingCommission.toFixed(2)} € pendente`,
                },
                {
                  label: "Validadas",
                  value: influencerData.totalValidated,
                  suffix: "",
                },
                {
                  label: "Comissão a receber",
                  value: influencerData.totalValidatedCommission.toFixed(2),
                  suffix: " €",
                  highlight: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl p-5 ${s.highlight ? "bg-olive-900 text-white" : "bg-white shadow-sm"}`}
                >
                  <p className={`text-xs font-semibold tracking-wide uppercase ${s.highlight ? "text-cream-50/60" : "text-olive-400"}`}>
                    {s.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${s.highlight ? "text-gold-500" : "text-olive-900"}`}>
                    {s.value}{s.suffix}
                  </p>
                  {s.sub && (
                    <p className="mt-0.5 text-[11px] text-olive-400">{s.sub}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Tabela mensal */}
            {influencerData.monthly.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b border-cream-100 px-5 py-4">
                  <p className="text-sm font-semibold text-olive-900">
                    Comissão mês a mês
                  </p>
                  <p className="mt-0.5 text-xs text-olive-500">
                    Comissão de {influencerData.commissionRate}% por adesão validada · carência de 15 dias
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b border-cream-100 text-left text-xs font-semibold uppercase tracking-wide text-olive-400">
                        <th className="px-5 py-3">Mês</th>
                        <th className="px-4 py-3 text-center">Novas</th>
                        <th className="px-4 py-3 text-center">Validadas</th>
                        <th className="px-4 py-3 text-center">Canceladas</th>
                        <th className="px-4 py-3 text-right">Comissão validada</th>
                        <th className="px-4 py-3 text-right">Em carência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {influencerData.monthly.map((m) => {
                        const [year, month] = m.month.split("-");
                        const label = new Date(
                          Number(year),
                          Number(month) - 1,
                          1,
                        ).toLocaleDateString("pt-PT", {
                          month: "long",
                          year: "numeric",
                        });
                        const total = m.pending + m.validated + m.cancelled;
                        return (
                          <tr key={m.month} className="hover:bg-cream-50/50">
                            <td className="px-5 py-3.5 font-medium capitalize text-olive-900">
                              {label}
                            </td>
                            <td className="px-4 py-3.5 text-center text-olive-600">
                              {total}
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-olive-900">
                              {m.validated > 0 ? m.validated : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-center text-wine-700/70">
                              {m.cancelled > 0 ? m.cancelled : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right font-semibold text-olive-900">
                              {m.validatedCommission > 0
                                ? `${m.validatedCommission.toFixed(2)} €`
                                : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right text-olive-400">
                              {m.pendingCommission > 0
                                ? `${m.pendingCommission.toFixed(2)} €`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {influencerData.totalReferrals === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-olive-900/15 p-8 text-center">
                <p className="font-display text-xl text-olive-900">
                  Ainda sem referências
                </p>
                <p className="mt-2 text-sm leading-6 text-olive-600">
                  Partilhe o seu código <span className="font-mono font-semibold">{influencerData.uniqueCode}</span> para começar a ganhar comissões.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Profile edit section */}
        <ProfileEditSection
          profile={profile}
          apiUrl={apiUrl ?? ""}
          onSaved={(updated) => setProfile((p) => p ? { ...p, ...updated } : p)}
        />
      </section>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountPageInner />
    </Suspense>
  );
}
