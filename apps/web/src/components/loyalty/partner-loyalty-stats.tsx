"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LoyaltyStats = {
  hasProgram: boolean;
  totalVisits: number;
  stampsIssued: number;
  rewardsRedeemed: number;
  repeatCustomers: number;
};

// Bloco "Selos Daqui" no dashboard do parceiro (métricas simples do MVP).
export function PartnerLoyaltyStats() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    createClient()
      .auth.getSession()
      .then(async ({ data }) => {
        const token = data.session?.access_token;
        if (!token || !apiUrl) return;
        try {
          const res = await fetch(`${apiUrl}/api/partner/loyalty/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const payload = (await res.json()) as { data?: LoyaltyStats };
            if (payload.data) setStats(payload.data);
          }
        } finally {
          setLoaded(true);
        }
      });
  }, []);

  if (!loaded || !stats || !stats.hasProgram) return null;

  const cards = [
    { label: "Visitas validadas", value: stats.totalVisits },
    { label: "Selos emitidos", value: stats.stampsIssued },
    { label: "Recompensas utilizadas", value: stats.rewardsRedeemed },
    { label: "Clientes recorrentes", value: stats.repeatCustomers },
  ];

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <span className="bg-gold-500 h-2.5 w-2.5 rounded-full" />
        <h2 className="text-base font-semibold text-olive-900">Selos Daqui</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-olive-900/10 bg-white p-4"
          >
            <p className="text-2xl font-bold text-olive-900">{c.value}</p>
            <p className="mt-1 text-xs text-olive-600">{c.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}