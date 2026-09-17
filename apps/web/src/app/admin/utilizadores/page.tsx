"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  redemptionsCount: number;
  isInfluencer: boolean;
  membershipStatus: "active" | "inactive";
  membershipSource: "PAID" | "ADMIN_GRANT" | "INFLUENCER_GRANT" | null;
  membershipEndsAt: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Membro",
  PARTNER: "Parceiro",
  ADMIN: "Admin",
  INFLUENCER: "Influencer",
};

const ROLE_COLORS: Record<string, string> = {
  MEMBER: "bg-olive-900/8 text-olive-700",
  PARTNER: "bg-gold-500/15 text-olive-900",
  ADMIN: "bg-wine-700/10 text-wine-700",
  INFLUENCER: "bg-gold-500/20 text-olive-900",
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

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role] ?? "bg-cream-100 text-olive-400"}`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return null;
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${SOURCE_COLORS[source] ?? "bg-cream-100 text-olive-400"}`}
    >
      {SOURCE_LABELS[source] ?? source}
    </span>
  );
}

function ChangeRoleModal({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    const { data: session } = await createClient().auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}/role`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      },
    );
    const json = (await res.json()) as { error?: string };
    if (json.error) {
      setError(json.error);
    } else {
      onSaved();
      onClose();
    }
    setSaving(false);
  }

  const roles = [
    { key: "MEMBER", desc: "Acesso à área de membro e benefícios" },
    { key: "INFLUENCER", desc: "Membro com dashboard de referências" },
    { key: "PARTNER", desc: "Acesso à validação de resgates de parceiro" },
    { key: "ADMIN", desc: "Acesso total — área de administração" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-olive-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-bold text-olive-900">
          Alterar role
        </h2>
        <p className="mb-5 text-sm text-olive-600">{user.fullName}</p>
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                role === r.key
                  ? "border-olive-700 bg-olive-900/5"
                  : "hover:bg-cream-50 border-transparent"
              }`}
            >
              <span
                className={`h-4 w-4 flex-none rounded-full border-2 ${
                  role === r.key
                    ? "border-olive-700 bg-olive-700"
                    : "border-olive-300"
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-olive-900">
                  {ROLE_LABELS[r.key]}
                </p>
                <p className="text-xs text-olive-500">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {error && <p className="text-wine-700 mt-3 text-sm">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="hover:bg-cream-50 flex-1 rounded-xl border border-olive-900/15 py-2.5 text-sm font-medium text-olive-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || role === user.role}
            className="flex-1 rounded-xl bg-olive-900 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 disabled:opacity-60"
          >
            {saving ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromoteInfluencerModal({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [commissionRate, setCommissionRate] = useState("10");
  const [customCode, setCustomCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const { data: session } = await createClient().auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${user.id}/promote-influencer`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commissionRate: Number(commissionRate),
          customCode: customCode || undefined,
        }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-olive-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-bold text-olive-900">
          Promover a influencer
        </h2>
        <p className="mb-5 text-sm text-olive-600">{user.fullName}</p>
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
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-olive-900">
              Código único{" "}
              <span className="font-normal text-olive-400">
                (opcional — gerado automaticamente)
              </span>
            </label>
            <input
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Ex: JOAO-1234"
              className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 font-mono text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
            />
          </div>
          <div className="rounded-xl bg-olive-900/5 px-4 py-3 text-xs text-olive-600">
            O utilizador receberá uma adesão gratuita de 12 meses caso não tenha
            uma activa.
          </div>
        </div>
        {error && <p className="text-wine-700 mt-3 text-sm">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="hover:bg-cream-50 flex-1 rounded-xl border border-olive-900/15 py-2.5 text-sm font-medium text-olive-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex-1 rounded-xl bg-olive-900 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 disabled:opacity-60"
          >
            {saving ? "A promover…" : "Promover"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUtilizadores() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [promoteUser, setPromoteUser] = useState<User | null>(null);

  async function load() {
    const { data: session } = await createClient().auth.getSession();
    const token = session.session?.access_token ?? "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      const json = (await res.json()) as { data: User[] };
      setUsers(json.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const effectiveRole = (u: User) => (u.isInfluencer ? "INFLUENCER" : u.role);

  const filtered =
    filter === "ALL" ? users : users.filter((u) => effectiveRole(u) === filter);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const tabs = [
    { key: "ALL", label: `Todos (${users.length})` },
    {
      key: "MEMBER",
      label: `Membros (${users.filter((u) => effectiveRole(u) === "MEMBER").length})`,
    },
    {
      key: "INFLUENCER",
      label: `Influencers (${users.filter((u) => effectiveRole(u) === "INFLUENCER").length})`,
    },
    {
      key: "PARTNER",
      label: `Parceiros (${users.filter((u) => effectiveRole(u) === "PARTNER").length})`,
    },
    {
      key: "ADMIN",
      label: `Admin (${users.filter((u) => effectiveRole(u) === "ADMIN").length})`,
    },
  ];

  return (
    <div>
      {editUser && (
        <ChangeRoleModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => void load()}
        />
      )}
      {promoteUser && (
        <PromoteInfluencerModal
          user={promoteUser}
          onClose={() => setPromoteUser(null)}
          onSaved={() => void load()}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-olive-900">Utilizadores</h1>
        <p className="mt-1 text-sm text-olive-600">
          Membros, parceiros e administradores
        </p>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex-none rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === t.key
                ? "bg-olive-900 text-white"
                : "hover:bg-cream-50 text-olive-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-cream-100/60 h-14 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-olive-400">
            Nenhum utilizador encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-cream-100 border-b">
                <tr className="text-left text-xs font-semibold tracking-wide text-olive-400 uppercase">
                  <th className="px-5 py-3.5">Utilizador</th>
                  <th className="px-4 py-3.5">Role / Estado</th>
                  <th className="px-4 py-3.5">Adesão</th>
                  <th className="px-4 py-3.5">Desde</th>
                  <th className="px-4 py-3.5 text-center">Resgates</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-cream-100 divide-y">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-cream-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-olive-900">
                        {u.fullName}
                      </p>
                      <p className="text-xs text-olive-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <RoleBadge
                          role={u.isInfluencer ? "INFLUENCER" : u.role}
                        />
                        {!u.isActive && (
                          <span className="bg-wine-700/10 text-wine-700 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold">
                            Inativo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {u.membershipStatus === "active" && u.membershipSource ? (
                        <SourceBadge source={u.membershipSource} />
                      ) : (
                        <span className="text-xs text-olive-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-olive-600">
                      {fmtDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-olive-900">
                      {u.redemptionsCount}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!u.isInfluencer &&
                          u.role !== "ADMIN" &&
                          u.role !== "PARTNER" && (
                            <button
                              onClick={() => setPromoteUser(u)}
                              className="text-gold-600 text-xs font-medium underline underline-offset-2 hover:text-olive-900"
                            >
                              Influencer
                            </button>
                          )}
                        <button
                          onClick={() => setEditUser(u)}
                          className="text-xs font-medium text-olive-600 underline underline-offset-2 hover:text-olive-900"
                        >
                          Role
                        </button>
                        <Link
                          href={`/admin/utilizadores/${u.id}`}
                          className="hover:text-wine-700 text-xs font-medium text-olive-900 underline underline-offset-2"
                        >
                          Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-cream-100 border-t px-5 py-3">
          <p className="text-xs text-olive-400">
            {filtered.length} utilizador{filtered.length !== 1 ? "es" : ""}
            {filter !== "ALL"
              ? ` com role ${ROLE_LABELS[filter] ?? filter}`
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
