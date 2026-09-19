"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export function CheckoutButton({ autoStart = false }: { autoStart?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.push("/registar?redirect=/checkout");
        return;
      }
      if (!apiUrl) throw new Error("Serviço de pagamentos indisponível");

      const response = await fetch(`${apiUrl}/api/payments/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = (await response.json()) as {
        data?: { url?: string | null };
        message?: string;
      };
      if (response.status === 401) {
        // The browser can retain a token for an account that was removed or
        // whose session expired. Clear it so the user can register/login again
        // instead of seeing the backend's generic "Invalid session" message.
        await supabase.auth.signOut();
        router.push("/registar?redirect=/checkout");
        return;
      }
      if (!response.ok || !payload.data?.url) {
        throw new Error(payload.message ?? "Não foi possível iniciar o pagamento");
      }
      window.location.assign(payload.data.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Não foi possível iniciar o pagamento",
      );
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (autoStart) void startCheckout();
  }, [autoStart, startCheckout]);

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="bg-wine-700 hover:bg-wine-800 inline-flex min-h-[48px] items-center rounded-full px-7 py-3 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "A abrir pagamento…" : "Aderir por 59 €"}
      </button>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
