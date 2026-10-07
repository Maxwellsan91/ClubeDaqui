"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LoyaltyCard } from "./loyalty-card";
import type { LoyaltyOverviewItem } from "@/types/loyalty";

// Secção "Os meus Selos" — carrega todos os programas onde o membro tem progresso.
export function MyLoyaltySection() {
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );
  const [items, setItems] = useState<LoyaltyOverviewItem[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    createClient()
      .auth.getSession()
      .then(async ({ data }) => {
        const token = data.session?.access_token;
        if (!token || !apiUrl) {
          setStatus("error");
          return;
        }
        try {
          const response = await fetch(`${apiUrl}/api/me/loyalty`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error();
          const payload = (await response.json()) as {
            data?: LoyaltyOverviewItem[];
          };
          const list = payload.data ?? [];
          setItems(list);
          setStatus(list.length === 0 ? "empty" : "ready");
        } catch {
          setStatus("error");
        }
      });
  }, []);

  if (status === "error") return null;

  return (
    <section className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-olive-900">Os meus Selos</h2>
          <p className="mt-1 text-sm text-olive-600">
            Acumule selos em cada visita e aproxime-se das suas recompensas.
          </p>
        </div>
      </div>

      {status === "loading" ? (
        <p className="mt-6 text-sm text-olive-700">A carregar os seus selos…</p>
      ) : null}

      {status === "empty" ? (
        <div className="mt-6 rounded-2xl border border-dashed border-olive-900/15 bg-cream-100 px-6 py-8 text-center">
          <p className="text-sm text-olive-700">
            Ainda não tem selos. Comece a acumular na sua próxima visita a um
            parceiro aderente.
          </p>
        </div>
      ) : null}

      {status === "ready" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LoyaltyCard key={item.programId} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}