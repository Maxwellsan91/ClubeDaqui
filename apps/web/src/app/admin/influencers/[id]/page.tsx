"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

type Referral = {
  id: string;
  memberName: string;
  status: "PENDING" | "VALIDATED" | "CANCELLED";
  createdAt: string;
  validatesAt: string;
  cancelledAt: string | null;
  commission: number;
  pendingCommission: number;
};

type MonthRow = {
  month: string;
  pending: number;
  validated: number;
  cancelled: number;
  validatedCommission: number;
  pendingCommission: number;
};

type Totals = {
  total: number;
  validated: number;
  pending: number;
  cancelled: number;
  validatedCommission: number;
  pendingCommission: number;
};

type InfluencerDetail = {
  id: string;
  name: string;
  email: string;
  uniqueCode: string;
  commissionRate: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  totals: Totals;
  monthly: MonthRow[];
  referrals: Referral[];
};

async function getToken() {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? "";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "Em carência",
      className: "bg-gold-500/15 text-olive-800",
    },
    VALIDATED: {
      label: "Validado",
      className: "bg-olive-900/10 text-olive-700",
    },
    CANCELLED: {
      label: "Cancelado",
      className: "bg-wine-700/10 text-wine-700",
    },
  };
  const s = map[status] ?? {
    label: status,
    className: "bg-cream-100 text-olive-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });
}

export default function InfluencerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InfluencerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ commissionRate: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function load() {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/admin/influencers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const json = (await res.json()) as {
        data?: InfluencerDetail;
        error?: string;
      };
      if (json.data) {
        setData(json.data);
        setForm({
          commissionRate: String(json.data.commissionRate),
          notes: json.data.notes ?? "",
        });
      } else {
        setError(json.error ?? "Erro ao carregar");
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveEdit() {
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/admin/influencers/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        commissionRate: Number(form.commissionRate),
        notes: form.notes || undefined,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (json.error) {
      setSaveError(json.error);
    } else {
      setEditing(false);
      void load();
    }
    setSaving(false);
  }

  async function toggleActive() {
    if (!data) return;
    const token = await getToken();
    await fetch(`${apiUrl}/api/admin/influencers/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive: !data.isActive }),
    });
    void load();
  }

  async function cancelReferral(referralId: string) {
    const token = await getToken();
    await fetch(`${apiUrl}/api/admin/referrals/${referralId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    void load();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center text-sm text-olive-400">
        {error ?? "Influencer não encontrado"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/admin/influencers"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-olive-500 transition-colors hover:text-olive-900"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Todos os influencers
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-olive-900">
                  {data.name}
                </h1>
                <button
                  onClick={() => void toggleActive()}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    data.isActive
                      ? "hover:bg-wine-700/10 hover:text-wine-700 bg-olive-900/10 text-olive-700"
                      : "bg-cream-100 text-olive-400 hover:bg-olive-900/10 hover:text-olive-700"
                  }`}
                >
                  {data.isActive ? "Ativo" : "Inativo"}
                </button>
              </div>
              <p className="mt-1 text-sm text-olive-500">{data.email}</p>
              <p className="mt-0.5 text-xs text-olive-400">
                Desde {fmt(data.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Code badge */}
              <div className="flex items-center gap-2 rounded-xl border border-olive-900/12 px-4 py-2.5">
                <span className="text-xs text-olive-400">Código</span>
                <span className="font-mono text-sm font-bold text-olive-900">
                  {data.uniqueCode}
                </span>
                <button
                  onClick={() =>
                    void navigator.clipboard.writeText(data.uniqueCode)
                  }
                  className="rounded p-0.5 text-olive-400 transition-colors hover:text-olive-700"
                  title="Copiar"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="rounded-xl bg-olive-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-olive-900/90"
              >
                Editar
              </button>
            </div>
          </div>

          {/* Details row */}
          <div className="border-cream-100 mt-4 flex flex-wrap gap-6 border-t pt-4 text-sm">
            <div>
              <span className="text-olive-400">Comissão</span>
              <span className="ml-2 font-semibold text-olive-900">
                {data.commissionRate}%
              </span>
            </div>
            {data.notes && (
              <div>
                <span className="text-olive-400">Notas</span>
                <span className="ml-2 text-olive-700">{data.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-olive-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-base font-bold text-olive-900">
              Editar influencer
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Comissão (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.commissionRate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, commissionRate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm outline-none focus:border-olive-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full resize-none rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm outline-none focus:border-olive-700"
                />
              </div>
            </div>
            {saveError && (
              <p className="text-wine-700 mt-3 text-sm">{saveError}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="hover:bg-cream-50 flex-1 rounded-xl border border-olive-900/15 py-2.5 text-sm font-medium text-olive-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => void saveEdit()}
                disabled={saving}
                className="flex-1 rounded-xl bg-olive-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "A guardar…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total indicados", value: data.totals.total, color: "" },
          { label: "Validados", value: data.totals.validated, color: "" },
          { label: "Em carência", value: data.totals.pending, color: "" },
          { label: "Cancelados", value: data.totals.cancelled, color: "" },
          {
            label: "Comissão devida",
            value: `${data.totals.validatedCommission.toFixed(2)} €`,
            color: "bg-olive-900 text-white",
          },
          {
            label: "Em processamento",
            value: `${data.totals.pendingCommission.toFixed(2)} €`,
            color: "bg-gold-500/15",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl p-4 shadow-sm ${s.color || "bg-white"}`}
          >
            <p
              className={`text-[10px] font-semibold tracking-wide uppercase ${s.color.includes("olive-900") ? "text-cream-50/60" : "text-olive-400"}`}
            >
              {s.label}
            </p>
            <p
              className={`mt-1 text-xl font-bold ${s.color.includes("olive-900") ? "text-gold-500" : "text-olive-900"}`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly payments */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-cream-100 border-b px-5 py-4">
          <h2 className="font-semibold text-olive-900">Pagamentos mês a mês</h2>
          <p className="mt-0.5 text-xs text-olive-500">
            Comissão de {data.commissionRate}% por adesão · preço base 24 € ·
            carência 15 dias
          </p>
        </div>
        {data.monthly.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-olive-400">
            Sem registos ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-cream-100 border-b">
                <tr className="text-left text-xs font-semibold tracking-wide text-olive-400 uppercase">
                  <th className="px-5 py-3">Mês</th>
                  <th className="px-4 py-3 text-center">Novas</th>
                  <th className="px-4 py-3 text-center">Validadas</th>
                  <th className="px-4 py-3 text-center">Canceladas</th>
                  <th className="px-4 py-3 text-right">A pagar</th>
                  <th className="px-4 py-3 text-right">Em processamento</th>
                </tr>
              </thead>
              <tbody className="divide-cream-100 divide-y">
                {data.monthly.map((m) => (
                  <tr key={m.month} className="hover:bg-cream-50/50">
                    <td className="px-5 py-3.5 font-medium text-olive-900 capitalize">
                      {monthLabel(m.month)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-olive-600">
                      {m.pending + m.validated + m.cancelled}
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-olive-900">
                      {m.validated || "—"}
                    </td>
                    <td className="text-wine-700/70 px-4 py-3.5 text-center">
                      {m.cancelled || "—"}
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
                ))}
              </tbody>
              <tfoot className="bg-cream-50/50 border-t-2 border-olive-900/10">
                <tr className="text-sm font-bold text-olive-900">
                  <td className="px-5 py-3">Total</td>
                  <td className="px-4 py-3 text-center">{data.totals.total}</td>
                  <td className="px-4 py-3 text-center">
                    {data.totals.validated || "—"}
                  </td>
                  <td className="text-wine-700/70 px-4 py-3 text-center">
                    {data.totals.cancelled || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-olive-900">
                    {data.totals.validatedCommission.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right text-olive-400">
                    {data.totals.pendingCommission.toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Referrals list */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-cream-100 border-b px-5 py-4">
          <h2 className="font-semibold text-olive-900">Indicados</h2>
          <p className="mt-0.5 text-xs text-olive-500">
            Membros que aderiram com o código {data.uniqueCode}
          </p>
        </div>
        {data.referrals.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-olive-400">
            Nenhum indicado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-cream-100 border-b">
                <tr className="text-left text-xs font-semibold tracking-wide text-olive-400 uppercase">
                  <th className="px-5 py-3">Membro</th>
                  <th className="px-4 py-3">Data de adesão</th>
                  <th className="px-4 py-3">Valida em</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Comissão</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-cream-100 divide-y">
                {data.referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-cream-50/50">
                    <td className="px-5 py-3.5 font-semibold text-olive-900">
                      {r.memberName}
                    </td>
                    <td className="px-4 py-3.5 text-olive-600">
                      {fmt(r.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-olive-600">
                      {r.status === "CANCELLED" ? (
                        <span className="text-wine-700/60">
                          Cancelado em{" "}
                          {r.cancelledAt ? fmt(r.cancelledAt) : "—"}
                        </span>
                      ) : (
                        fmt(r.validatesAt)
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold">
                      {r.status === "VALIDATED" ? (
                        <span className="text-olive-900">
                          {r.commission.toFixed(2)} €
                        </span>
                      ) : r.status === "PENDING" ? (
                        <span className="text-olive-400">
                          {r.pendingCommission.toFixed(2)} € *
                        </span>
                      ) : (
                        <span className="text-olive-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => void cancelReferral(r.id)}
                          className="text-wine-700/60 hover:text-wine-700 text-xs font-medium underline underline-offset-2 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-cream-100 border-t px-5 py-3">
              <p className="text-xs text-olive-400">
                * Comissão em carência — processada após 15 dias sem
                cancelamento
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
