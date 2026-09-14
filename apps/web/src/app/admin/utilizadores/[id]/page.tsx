"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Membership = {
  id: string;
  status: string;
  source: "PAID" | "ADMIN_GRANT" | "INFLUENCER_GRANT";
  endsAt: string | null;
  createdAt: string;
};

type Redemption = {
  id: string;
  redeemed_at: string;
  status: string;
  benefits: { title: string; businesses: { name: string } | null } | null;
};

type StatusLog = {
  id: string;
  previousActive: boolean;
  newActive: boolean;
  reason: string;
  changedByName: string;
  createdAt: string;
};

type UserDetail = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  memberships: Membership[];
  recentRedemptions: Redemption[];
  influencer: { id: string; uniqueCode: string; commissionRate: number } | null;
  statusLogs: StatusLog[];
};

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Membro",
  PARTNER: "Parceiro",
  ADMIN: "Admin",
  INFLUENCER: "Influencer",
};

const SOURCE_LABELS: Record<string, string> = {
  PAID: "Pago",
  ADMIN_GRANT: "Cortesia",
  INFLUENCER_GRANT: "Influencer",
};

const SOURCE_COLORS: Record<string, string> = {
  PAID: "bg-olive-900/8 text-olive-700",
  ADMIN_GRANT: "bg-wine-700/10 text-wine-700",
  INFLUENCER_GRANT: "bg-gold-500/15 text-olive-900",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusToggleModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserDetail;
  onClose: () => void;
  onSaved: (newActive: boolean) => void;
}) {
  const newActive = !user.isActive;
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!reason.trim()) {
      setError("O motivo é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data: session } = await createClient().auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: newActive, reason: reason.trim() }),
      },
    );
    const json = (await res.json()) as { error?: string };
    if (json.error) {
      setError(json.error);
      setSaving(false);
    } else {
      onSaved(newActive);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-olive-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-bold text-olive-900">
          {newActive ? "Ativar utilizador" : "Desativar utilizador"}
        </h2>
        <p className="mb-5 text-sm text-olive-600">{user.fullName}</p>
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            newActive
              ? "bg-olive-900/5 text-olive-700"
              : "bg-wine-700/8 text-wine-700"
          }`}
        >
          {newActive
            ? "O utilizador voltará a ter acesso à plataforma e benefícios."
            : "O utilizador perderá acesso à plataforma. Os dados são mantidos."}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-olive-900">
            Motivo da alteração <span className="text-wine-700">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva o motivo desta alteração de estado…"
            className="w-full resize-none rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
          />
        </div>
        {error && <p className="mt-2 text-sm text-wine-700">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-olive-900/15 py-2.5 text-sm font-medium text-olive-700 hover:bg-cream-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
              newActive ? "bg-olive-900 hover:bg-olive-900/90" : "bg-wine-700 hover:bg-wine-700/90"
            }`}
          >
            {saving ? "A guardar…" : newActive ? "Ativar" : "Desativar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GrantMembershipModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const { data: session } = await createClient().auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/grant-membership`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ source: "ADMIN_GRANT" }),
      },
    );
    const json = (await res.json()) as { error?: string };
    if (json.error) {
      setError(json.error);
      setSaving(false);
    } else {
      onSaved();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-olive-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-bold text-olive-900">Conceder cortesia</h2>
        <p className="mb-4 text-sm text-olive-600">
          Uma adesão gratuita de 12 meses será atribuída a este utilizador, identificada como
          &ldquo;Cortesia&rdquo;.
        </p>
        {error && <p className="mb-3 text-sm text-wine-700">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-olive-900/15 py-2.5 text-sm font-medium text-olive-700 hover:bg-cream-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex-1 rounded-xl bg-olive-900 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 disabled:opacity-60"
          >
            {saving ? "A conceder…" : "Conceder"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);

  async function load() {
    const { data: session } = await createClient().auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${params.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      const json = (await res.json()) as { data: UserDetail; error?: string };
      if (json.data) setUser(json.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-white" />
        <div className="h-48 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <p className="text-sm text-olive-500">Utilizador não encontrado.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-olive-700 underline">
          Voltar
        </button>
      </div>
    );
  }

  const activeMembership = user.memberships.find(
    (m) => m.status === "active" && m.endsAt && new Date(m.endsAt) > new Date(),
  );

  return (
    <div className="space-y-6">
      {showStatusModal && (
        <StatusToggleModal
          user={user}
          onClose={() => setShowStatusModal(false)}
          onSaved={(newActive) => {
            setUser((u) => (u ? { ...u, isActive: newActive } : u));
            void load();
          }}
        />
      )}
      {showGrantModal && (
        <GrantMembershipModal
          userId={user.id}
          onClose={() => setShowGrantModal(false)}
          onSaved={() => void load()}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/utilizadores"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-olive-900/15 text-olive-600 hover:bg-cream-50"
        >
          ←
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-olive-900">{user.fullName}</h1>
          <p className="text-sm text-olive-500">{user.email}</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-olive-400">Role</p>
              <p className="mt-1 font-semibold text-olive-900">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-olive-400">Estado</p>
              <p className={`mt-1 font-semibold ${user.isActive ? "text-olive-700" : "text-wine-700"}`}>
                {user.isActive ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-olive-400">Membro desde</p>
              <p className="mt-1 text-olive-700">{fmtDate(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-olive-400">Adesão activa</p>
              <p className="mt-1 text-olive-700">
                {activeMembership
                  ? `${SOURCE_LABELS[activeMembership.source] ?? activeMembership.source} · até ${fmtDate(activeMembership.endsAt!)}`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowStatusModal(true)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                user.isActive
                  ? "border border-wine-700/20 text-wine-700 hover:bg-wine-700/5"
                  : "bg-olive-900 text-white hover:bg-olive-900/90"
              }`}
            >
              {user.isActive ? "Desativar" : "Ativar"}
            </button>
            {!activeMembership && (
              <button
                onClick={() => setShowGrantModal(true)}
                className="rounded-xl border border-olive-900/15 px-4 py-2 text-sm font-medium text-olive-700 hover:bg-cream-50"
              >
                Cortesia
              </button>
            )}
          </div>
        </div>

        {user.influencer && (
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-gold-500/10 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wide text-olive-700">Influencer</span>
            <span className="font-mono text-sm font-semibold text-olive-900">{user.influencer.uniqueCode}</span>
            <span className="ml-auto text-xs text-olive-600">
              Comissão: {user.influencer.commissionRate}%
            </span>
            <Link
              href={`/admin/influencers/${user.influencer!.id}`}
              className="text-xs font-medium text-olive-700 underline underline-offset-2"
            >
              Ver detalhe
            </Link>
          </div>
        )}
      </div>

      {/* Memberships */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-cream-100 px-6 py-4">
          <h2 className="text-sm font-bold text-olive-900">Adesões</h2>
        </div>
        {user.memberships.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-olive-400">Nenhuma adesão registada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-cream-100">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-olive-400">
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Início</th>
                  <th className="px-4 py-3">Validade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {user.memberships.map((m) => {
                  const isActive = m.status === "active" && m.endsAt && new Date(m.endsAt) > new Date();
                  return (
                    <tr key={m.id}>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isActive ? "bg-olive-900/8 text-olive-700" : "bg-cream-100 text-olive-400"
                          }`}
                        >
                          {isActive ? "Ativa" : "Expirada"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${SOURCE_COLORS[m.source] ?? "bg-cream-100 text-olive-400"}`}
                        >
                          {SOURCE_LABELS[m.source] ?? m.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-olive-600">{fmtDate(m.createdAt)}</td>
                      <td className="px-4 py-3 text-olive-600">
                        {m.endsAt ? fmtDate(m.endsAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent redemptions */}
      {user.recentRedemptions.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm">
          <div className="border-b border-cream-100 px-6 py-4">
            <h2 className="text-sm font-bold text-olive-900">
              Resgates recentes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="border-b border-cream-100">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-olive-400">
                  <th className="px-6 py-3">Benefício</th>
                  <th className="px-4 py-3">Parceiro</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {user.recentRedemptions.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-3 font-medium text-olive-900">
                      {r.benefits?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-olive-600">
                      {r.benefits?.businesses?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-olive-500">
                      {fmtDate(r.redeemed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status audit log */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="border-b border-cream-100 px-6 py-4">
          <h2 className="text-sm font-bold text-olive-900">Histórico de estado</h2>
        </div>
        {user.statusLogs.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-olive-400">
            Sem alterações de estado registadas.
          </p>
        ) : (
          <div className="divide-y divide-cream-100">
            {user.statusLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-6 py-4">
                <div
                  className={`mt-0.5 h-2.5 w-2.5 flex-none rounded-full ${
                    log.newActive ? "bg-olive-700" : "bg-wine-700"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-olive-900">
                    {log.previousActive ? "Ativo" : "Inativo"}
                    {" → "}
                    {log.newActive ? "Ativo" : "Inativo"}
                  </p>
                  <p className="mt-0.5 text-sm text-olive-600">{log.reason}</p>
                  <p className="mt-1 text-xs text-olive-400">
                    {log.changedByName} · {fmtDateTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}