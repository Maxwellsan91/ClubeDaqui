"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  fullName: string;
  role: string;
  createdAt: string;
  redemptionsCount: number;
};

const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Membro",
  PARTNER: "Parceiro",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  MEMBER: "bg-olive-900/8 text-olive-700",
  PARTNER: "bg-gold-500/15 text-olive-900",
  ADMIN: "bg-wine-700/10 text-wine-700",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-olive-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-bold text-olive-900">
          Alterar role
        </h2>
        <p className="mb-5 text-sm text-olive-600">{user.fullName}</p>
        <div className="space-y-2">
          {(["MEMBER", "PARTNER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                role === r
                  ? "border-olive-700 bg-olive-900/5"
                  : "border-transparent hover:bg-cream-50"
              }`}
            >
              <span
                className={`h-4 w-4 flex-none rounded-full border-2 ${
                  role === r
                    ? "border-olive-700 bg-olive-700"
                    : "border-olive-300"
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-olive-900">
                  {ROLE_LABELS[r]}
                </p>
                <p className="text-xs text-olive-500">
                  {r === "MEMBER" && "Acesso à área de membro e benefícios"}
                  {r === "PARTNER" &&
                    "Acesso à validação de resgates de parceiro"}
                  {r === "ADMIN" && "Acesso total — área de administração"}
                </p>
              </div>
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-wine-700">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-olive-900/15 py-2.5 text-sm font-medium text-olive-700 hover:bg-cream-50"
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

export default function AdminUtilizadores() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [editUser, setEditUser] = useState<User | null>(null);

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
    void load();
  }, []);

  const filtered =
    filter === "ALL" ? users : users.filter((u) => u.role === filter);

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
      label: `Membros (${users.filter((u) => u.role === "MEMBER").length})`,
    },
    {
      key: "PARTNER",
      label: `Parceiros (${users.filter((u) => u.role === "PARTNER").length})`,
    },
    {
      key: "ADMIN",
      label: `Admin (${users.filter((u) => u.role === "ADMIN").length})`,
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-olive-900">Utilizadores</h1>
        <p className="mt-1 text-sm text-olive-600">
          Membros, parceiros e administradores
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex-none rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === t.key
                ? "bg-olive-900 text-white"
                : "text-olive-600 hover:bg-cream-50"
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
              <div key={i} className="h-14 animate-pulse rounded-xl bg-cream-100/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-olive-400">
            Nenhum utilizador encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-sm">
              <thead className="border-b border-cream-100">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-olive-400">
                  <th className="px-5 py-3.5">Utilizador</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Membro desde</th>
                  <th className="px-4 py-3.5 text-center">Resgates</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-cream-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-olive-900">
                        {u.fullName}
                      </p>
                      <p className="font-mono text-[11px] text-olive-400 select-all">
                        {u.id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-4 text-olive-600">
                      {fmtDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-olive-900">
                      {u.redemptionsCount}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setEditUser(u)}
                        className="text-xs font-medium text-olive-600 hover:text-olive-900 underline underline-offset-2"
                      >
                        Alterar role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-cream-100 px-5 py-3">
          <p className="text-xs text-olive-400">
            {filtered.length} utilizador{filtered.length !== 1 ? "es" : ""}
            {filter !== "ALL" ? ` com role ${ROLE_LABELS[filter]}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}