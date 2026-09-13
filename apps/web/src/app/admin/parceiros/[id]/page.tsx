"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// PG DOW: 0=Sun,1=Mon,...,6=Sat  displayed in order Mon→Sun
const DAYS = [
  { label: "Seg", pgDow: 1 },
  { label: "Ter", pgDow: 2 },
  { label: "Qua", pgDow: 3 },
  { label: "Qui", pgDow: 4 },
  { label: "Sex", pgDow: 5 },
  { label: "Sáb", pgDow: 6 },
  { label: "Dom", pgDow: 0 },
];

const BENEFIT_TYPES = [
  { value: "BUY_ONE_GET_ONE", label: "2º item grátis (BOGO)" },
  { value: "PERCENTAGE_DISCOUNT", label: "Desconto em percentagem" },
  { value: "FREE_ITEM", label: "Item gratuito" },
  { value: "FIXED_DISCOUNT", label: "Desconto fixo (€)" },
];

type BusinessDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  instagram: string | null;
  websiteUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  categorySlug: string | null;
  categoryName: string | null;
  location: {
    id?: string;
    addressLine1: string | null;
    postalCode: string | null;
    locality: string | null;
    municipality: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
  } | null;
  benefit: {
    id: string;
    title: string;
    description: string | null;
    terms: string | null;
    type: string;
  } | null;
  benefitRules: {
    allowedWeekdays: number[];
    startsAt: string;
    endsAt: string;
    reservationRequired: boolean;
    cycleLimit: number;
  } | null;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-olive-400">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-olive-900">
        {label}
      </label>
      {hint && <p className="mb-1.5 text-xs text-olive-400">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-olive-900/12 bg-cream-50 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:bg-white focus:ring-2 focus:ring-olive-700/10 transition-colors";
const textareaCls = inputCls + " resize-none";

export default function EditPartnerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("comer");
  const [imageUrl, setImageUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [addrLine1, setAddrLine1] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [locality, setLocality] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationPhone, setLocationPhone] = useState("");

  const [benefitTitle, setBenefitTitle] = useState("");
  const [benefitDesc, setBenefitDesc] = useState("");
  const [benefitType, setBenefitType] = useState("BUY_ONE_GET_ONE");
  const [benefitTerms, setBenefitTerms] = useState("");

  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [startsAt, setStartsAt] = useState("12:00");
  const [endsAt, setEndsAt] = useState("22:00");
  const [reservationRequired, setReservationRequired] = useState(false);
  const [cycleLimit, setCycleLimit] = useState(1);

  async function getToken() {
    const { data: session } = await createClient().auth.getSession();
    return session.session?.access_token ?? "";
  }

  const load = useCallback(async () => {
    const token = await getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/businesses/${id}/detail`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) { setLoading(false); return; }
    const json = (await res.json()) as { data: BusinessDetail };
    const d = json.data;
    setData(d);

    setName(d.name);
    setDescription(d.description ?? "");
    setCategorySlug(d.categorySlug ?? "comer");
    setImageUrl(d.imageUrl ?? "");
    setPhone(d.phone ?? "");
    setInstagram(d.instagram ?? "");
    setWebsiteUrl(d.websiteUrl ?? "");
    setIsActive(d.isActive);

    if (d.location) {
      setAddrLine1(d.location.addressLine1 ?? "");
      setPostalCode(d.location.postalCode ?? "");
      setLocality(d.location.locality ?? "");
      setMunicipality(d.location.municipality ?? "");
      setLatitude(d.location.latitude?.toString() ?? "");
      setLongitude(d.location.longitude?.toString() ?? "");
      setLocationPhone(d.location.phone ?? "");
    }

    if (d.benefit) {
      setBenefitTitle(d.benefit.title);
      setBenefitDesc(d.benefit.description ?? "");
      setBenefitType(d.benefit.type);
      setBenefitTerms(d.benefit.terms ?? "");
    }

    if (d.benefitRules) {
      setSelectedDays(new Set(d.benefitRules.allowedWeekdays));
      setStartsAt(d.benefitRules.startsAt);
      setEndsAt(d.benefitRules.endsAt);
      setReservationRequired(d.benefitRules.reservationRequired);
      setCycleLimit(d.benefitRules.cycleLimit);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  function toggleDay(pgDow: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(pgDow) ? next.delete(pgDow) : next.add(pgDow);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const token = await getToken();
    const body = {
      name,
      description: description || null,
      phone: phone || null,
      instagram: instagram || null,
      websiteUrl: websiteUrl || null,
      imageUrl: imageUrl || null,
      isActive,
      categorySlug,
      location: {
        addressLine1: addrLine1 || null,
        postalCode: postalCode || null,
        locality: locality || null,
        municipality: municipality || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        phone: locationPhone || null,
      },
      benefit: {
        title: benefitTitle,
        description: benefitDesc || null,
        terms: benefitTerms || null,
        type: benefitType,
      },
      benefitRules: {
        allowedWeekdays: Array.from(selectedDays),
        startsAt,
        endsAt,
        reservationRequired,
        cycleLimit,
      },
    };
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/businesses/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    const json = (await res.json()) as { success?: boolean; error?: string };
    if (json.error) {
      setError(json.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-olive-600">Parceiro não encontrado.</p>
        <Link href="/admin/parceiros" className="mt-4 inline-block text-sm underline text-olive-700">
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <Link
          href="/admin/parceiros"
          className="mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white text-olive-600 shadow-sm hover:bg-cream-100 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-olive-900">{data.name}</h1>
          <p className="mt-0.5 font-mono text-xs text-olive-400">/explorar/{data.slug}</p>
        </div>
        <a
          href={`/explorar/${data.slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex-none rounded-xl border border-olive-900/12 bg-white px-3.5 py-2 text-xs font-medium text-olive-600 hover:bg-cream-50 transition-colors shadow-sm"
        >
          Ver página →
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Informações básicas */}
          <Section title="Informações básicas">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do estabelecimento">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Categoria">
                <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className={inputCls}>
                  <option value="comer">Comer</option>
                  <option value="dormir">Dormir</option>
                  <option value="lazer">Lazer</option>
                </select>
              </Field>
            </div>
            <Field label="Descrição curta">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={textareaCls}
                placeholder="Breve descrição do estabelecimento…"
              />
            </Field>
            <Field label="URL da imagem do card" hint="Paste uma URL de imagem (JPEG/PNG/WebP). Use serviços como Unsplash ou Cloudinary.">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputCls}
                placeholder="https://images.unsplash.com/…"
              />
              {imageUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-olive-900/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Preview" className="h-40 w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </Field>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`relative h-6 w-11 flex-none rounded-full transition-colors ${isActive ? "bg-olive-700" : "bg-olive-900/20"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <span className="text-sm text-olive-700">{isActive ? "Estabelecimento ativo" : "Estabelecimento inativo"}</span>
            </div>
          </Section>

          {/* Contactos */}
          <Section title="Contactos">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telefone">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+351 243 000 000" />
              </Field>
              <Field label="Instagram (sem @)">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-olive-400">@</span>
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputCls + " pl-8"} placeholder="handle" />
                </div>
              </Field>
              <Field label="Website">
                <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputCls} placeholder="https://…" />
              </Field>
            </div>
          </Section>

          {/* Localização */}
          <Section title="Localização">
            <Field label="Morada">
              <input value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} className={inputCls} placeholder="Rua, número…" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Código Postal">
                <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputCls} placeholder="0000-000" />
              </Field>
              <Field label="Localidade">
                <input value={locality} onChange={(e) => setLocality(e.target.value)} className={inputCls} placeholder="Almeirim" />
              </Field>
              <Field label="Município">
                <input value={municipality} onChange={(e) => setMunicipality(e.target.value)} className={inputCls} placeholder="Almeirim" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Latitude">
                <input value={latitude} onChange={(e) => setLatitude(e.target.value)} className={inputCls} placeholder="39.2028" type="number" step="any" />
              </Field>
              <Field label="Longitude">
                <input value={longitude} onChange={(e) => setLongitude(e.target.value)} className={inputCls} placeholder="-8.6281" type="number" step="any" />
              </Field>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Benefício */}
          <Section title="Benefício">
            <Field label="Tipo de benefício">
              <select value={benefitType} onChange={(e) => setBenefitType(e.target.value)} className={inputCls}>
                {BENEFIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Título (aparece no card)">
              <input value={benefitTitle} onChange={(e) => setBenefitTitle(e.target.value)} className={inputCls} placeholder="Na compra de 1 prato, o 2º é grátis" />
            </Field>
            <Field label="Descrição curta">
              <textarea value={benefitDesc} onChange={(e) => setBenefitDesc(e.target.value)} rows={2} className={textareaCls} placeholder="Ao pedir dois pratos…" />
            </Field>
          </Section>

          {/* Regras de utilização */}
          <Section title="Regras de utilização">
            <Field
              label="Regras (uma por linha)"
              hint="Cada linha será apresentada como um ponto na página do parceiro."
            >
              <textarea
                value={benefitTerms}
                onChange={(e) => setBenefitTerms(e.target.value)}
                rows={7}
                className={textareaCls}
                placeholder={`Necessário o mínimo de 2 pessoas\nNão válido em feriados\nNão acumulável com outras promoções`}
              />
            </Field>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReservationRequired((v) => !v)}
                className={`relative h-6 w-11 flex-none rounded-full transition-colors ${reservationRequired ? "bg-olive-700" : "bg-olive-900/20"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${reservationRequired ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <span className="text-sm text-olive-700">Reserva obrigatória</span>
            </div>
            <Field label="Limite de utilizações por período">
              <input
                type="number"
                min={1}
                max={99}
                value={cycleLimit}
                onChange={(e) => setCycleLimit(parseInt(e.target.value) || 1)}
                className={inputCls}
              />
            </Field>
          </Section>

          {/* Dias e horários */}
          <Section title="Dias e horários">
            <Field label="Dias em que o benefício é válido">
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.pgDow}
                    type="button"
                    onClick={() => toggleDay(d.pgDow)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selectedDays.has(d.pgDow)
                        ? "bg-olive-900 text-white"
                        : "bg-cream-100 text-olive-600 hover:bg-cream-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hora de abertura">
                <input type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Hora de fecho">
                <input type="time" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-olive-900/10 bg-white/95 px-5 py-3 backdrop-blur-sm lg:left-56">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="text-sm">
            {error && <p className="text-wine-700">{error}</p>}
            {saved && <p className="text-olive-700">✓ Alterações guardadas</p>}
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/parceiros"
              className="rounded-xl border border-olive-900/15 px-5 py-2.5 text-sm font-medium text-olive-700 hover:bg-cream-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              onClick={() => void save()}
              disabled={saving}
              className="rounded-xl bg-olive-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 transition-colors disabled:opacity-60"
            >
              {saving ? "A guardar…" : "Guardar alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}