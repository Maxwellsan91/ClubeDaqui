"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Influencer = {
  id: string;
  name: string;
  email: string;
  uniqueCode: string;
  commissionRate: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

async function getToken() {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token ?? "";
}

function CodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copiar código"
      className="inline-flex items-center gap-1.5 rounded-lg bg-olive-900/8 px-2.5 py-1 font-mono text-xs font-semibold text-olive-900 hover:bg-olive-900/15 transition-colors"
    >
      {code}
      <svg className="h-3 w-3 text-olive-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {copied ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
    </button>
  );
}

type FormState = {
  name: string;
  email: string;
  commissionRate: string;
  uniqueCode: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  commissionRate: "10",
  uniqueCode: "",
  notes: "",
};

export default function AdminInfluencers() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Influencer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/admin/influencers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const json = (await res.json()) as { data: Influencer[] };
      setInfluencers(json.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  }

  function openEdit(inf: Influencer) {
    setEditing(inf);
    setForm({
      name: inf.name,
      email: inf.email,
      commissionRate: String(inf.commissionRate),
      uniqueCode: inf.uniqueCode,
      notes: inf.notes ?? "",
    });
    setError(null);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const token = await getToken();
    const payload = {
      name: form.name,
      email: form.email,
      commissionRate: Number(form.commissionRate),
      uniqueCode: form.uniqueCode || undefined,
      notes: form.notes || undefined,
    };

    const url = editing
      ? `${apiUrl}/api/admin/influencers/${editing.id}`
      : `${apiUrl}/api/admin/influencers`;
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { error?: string };
    if (json.error) {
      setError(json.error);
      setSaving(false);
    } else {
      setShowModal(false);
      setSaving(false);
      void load();
    }
  }

  async function toggleActive(inf: Influencer) {
    const token = await getToken();
    await fetch(`${apiUrl}/api/admin/influencers/${inf.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive: !inf.isActive }),
    });
    void load();
  }

  const active = influencers.filter((i) => i.isActive).length;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-olive-900">Influencers</h1>
          <p className="mt-1 text-sm text-olive-600">
            Gestão de códigos únicos e comissões
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-olive-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar influencer
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: influencers.length },
          { label: "Ativos", value: active },
          { label: "Inativos", value: influencers.length - active },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-olive-400">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-olive-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-olive-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-olive-900">
              {editing ? "Editar influencer" : "Novo influencer"}
            </h2>
            <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Nome *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="João Silva"
                  className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="joao@exemplo.pt"
                  className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                    Código único
                  </label>
                  <input
                    value={form.uniqueCode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        uniqueCode: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder={editing ? editing.uniqueCode : "Auto"}
                    disabled={!!editing}
                    className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 font-mono text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10 disabled:bg-cream-50 disabled:text-olive-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Notas
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Plataforma, acordo, etc."
                  className="w-full resize-none rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
                />
              </div>
              {error && <p className="text-sm text-wine-700">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-olive-900/15 py-2.5 text-sm font-medium text-olive-700 hover:bg-cream-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-olive-900 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 transition-colors disabled:opacity-60"
                >
                  {saving ? "A guardar…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-cream-100/60" />
            ))}
          </div>
        ) : influencers.length === 0 ? (
          <div className="py-16 text-center text-sm text-olive-400">
            Nenhum influencer registado ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-cream-100">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-olive-400">
                  <th className="px-5 py-3.5">Nome</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Código</th>
                  <th className="px-4 py-3.5 text-center">Comissão</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {influencers.map((inf) => (
                  <tr key={inf.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-olive-900">{inf.name}</p>
                      {inf.notes && (
                        <p className="mt-0.5 text-xs text-olive-400 truncate max-w-[180px]">
                          {inf.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-olive-600">{inf.email}</td>
                    <td className="px-4 py-4">
                      <CodeBadge code={inf.uniqueCode} />
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-olive-900">
                      {inf.commissionRate}%
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => void toggleActive(inf)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          inf.isActive
                            ? "bg-olive-900/10 text-olive-700 hover:bg-wine-700/10 hover:text-wine-700"
                            : "bg-cream-100 text-olive-400 hover:bg-olive-900/10 hover:text-olive-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${inf.isActive ? "bg-olive-600" : "bg-olive-300"}`}
                        />
                        {inf.isActive ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => openEdit(inf)}
                        className="rounded-lg bg-olive-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-olive-900/90 transition-colors"
                      >
                        Editar
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
            {influencers.length} influencer{influencers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}