"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Business = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  city: string;
  category: string;
  activeBenefits: number;
  redemptionsCount: number;
};

function RoleBadge({ benefits }: { benefits: number }) {
  if (benefits > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-olive-900/10 px-2.5 py-0.5 text-xs font-medium text-olive-700">
        <span className="h-1.5 w-1.5 rounded-full bg-olive-600" />
        Parceiro ativo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-olive-400">
      Sem benefício
    </span>
  );
}

export default function AdminParceiros() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    categorySlug: "comer",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getToken() {
    const { data } = await createClient().auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function load() {
    const token = await getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/businesses`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      const json = (await res.json()) as { data: Business[] };
      setBusinesses(json.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const token = await getToken();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/admin/businesses`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      },
    );
    const json = (await res.json()) as { error?: string; data?: { id: string } };
    if (json.error) {
      setError(json.error);
      setSaving(false);
    } else {
      setAdding(false);
      // Redirect to edit page to fill in all details
      if (json.data?.id) {
        router.push(`/admin/parceiros/${json.data.id}`);
      } else {
        void load();
        setSaving(false);
      }
    }
  }

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-olive-900">Parceiros</h1>
          <p className="mt-1 text-sm text-olive-600">
            Estabelecimentos cadastrados na plataforma
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-xl bg-olive-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar parceiro
        </button>
      </div>

      {/* Add form modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-olive-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-olive-900">
              Novo estabelecimento
            </h2>
            <form onSubmit={(e) => void handleAdd(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Nome *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({ ...f, name, slug: autoSlug(name) }));
                  }}
                  placeholder="Ex: Restaurante O Solar"
                  className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Slug (URL) *
                </label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  placeholder="restaurante-o-solar"
                  className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm font-mono text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Categoria
                </label>
                <select
                  value={form.categorySlug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categorySlug: e.target.value }))
                  }
                  className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700"
                >
                  <option value="comer">Comer</option>
                  <option value="dormir">Dormir</option>
                  <option value="lazer">Lazer</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-olive-900">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Breve descrição do estabelecimento"
                  className="w-full rounded-xl border border-olive-900/15 px-3.5 py-2.5 text-sm text-olive-900 outline-none focus:border-olive-700 focus:ring-2 focus:ring-olive-700/10 resize-none"
                />
              </div>
              {error && (
                <p className="text-sm text-wine-700">{error}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="flex-1 rounded-xl border border-olive-900/15 py-2.5 text-sm font-medium text-olive-700 hover:bg-cream-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-olive-900 py-2.5 text-sm font-semibold text-white hover:bg-olive-900/90 transition-colors disabled:opacity-60"
                >
                  {saving ? "A guardar…" : "Adicionar"}
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
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-cream-100/60" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="py-16 text-center text-sm text-olive-400">
            Nenhum estabelecimento encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-cream-100">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-olive-400">
                  <th className="px-5 py-3.5">Estabelecimento</th>
                  <th className="px-4 py-3.5">Categoria</th>
                  <th className="px-4 py-3.5">Cidade</th>
                  <th className="px-4 py-3.5 text-center">Benefícios</th>
                  <th className="px-4 py-3.5 text-center">Resgates</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-olive-900">{b.name}</p>
                      <p className="text-xs text-olive-400 font-mono">{b.slug}</p>
                    </td>
                    <td className="px-4 py-4 text-olive-600">{b.category}</td>
                    <td className="px-4 py-4 text-olive-600">{b.city}</td>
                    <td className="px-4 py-4 text-center font-semibold text-olive-900">
                      {b.activeBenefits}
                    </td>
                    <td className="px-4 py-4 text-center text-olive-600">
                      {b.redemptionsCount}
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge benefits={b.activeBenefits} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <a
                          href={`/explorar/${b.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-olive-400 hover:text-olive-600 underline underline-offset-2"
                        >
                          Ver página
                        </a>
                        <a
                          href={`/admin/parceiros/${b.id}`}
                          className="rounded-lg bg-olive-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-olive-900/90 transition-colors"
                        >
                          Editar
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-cream-100 px-5 py-3">
          <p className="text-xs text-olive-400">
            {businesses.length} estabelecimento{businesses.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}