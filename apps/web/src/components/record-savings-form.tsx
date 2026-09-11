"use client";

import { FormEvent, useState } from "react";
import type { SavingsCategory, SavingsRecord } from "@/types/member";

export function RecordSavingsForm({
  onSaved,
  redemptionId,
  businessName = "Benefício utilizado",
  businessSlug = "explorar",
  defaultCategory = "Gastronomia",
}: {
  onSaved: (record: SavingsRecord) => void;
  redemptionId?: string;
  businessName?: string;
  businessSlug?: string;
  defaultCategory?: SavingsCategory;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const total = Number(form.get("total_bill_amount"));
    const discount = Number(form.get("discount_amount"));
    if (
      !Number.isFinite(total) ||
      !Number.isFinite(discount) ||
      total < 0 ||
      discount < 0 ||
      discount > total
    ) {
      setError(
        "Introduza valores válidos. O desconto não pode ser superior à fatura.",
      );
      return;
    }
    setSaving(true);
    if (redemptionId) {
      try {
        const { data } = await (
          await import("@/lib/supabase/client")
        )
          .createClient()
          .auth.getSession();
        const token = data.session?.access_token;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!token || !apiUrl) throw new Error();
        const response = await fetch(
          `${apiUrl}/api/me/redemptions/${redemptionId}/financials`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              total_bill_amount: total,
              discount_amount: discount,
            }),
          },
        );
        if (!response.ok) throw new Error();
      } catch {
        setError("Não foi possível guardar a economia. Tente novamente.");
        setSaving(false);
        return;
      }
    }
    onSaved({
      id: redemptionId ?? crypto.randomUUID(),
      redemptionId,
      businessName,
      businessSlug,
      category: form.get("category") as SavingsCategory,
      redeemedAt: new Date().toISOString(),
      totalBillAmount: total,
      discountAmount: discount,
    });
    event.currentTarget.reset();
    setError("");
    setSaving(false);
    setSaved(true);
  }
  return (
    <form
      onSubmit={submit}
      className="bg-cream-100 rounded-3xl border border-olive-900/10 p-6"
    >
      <h2 className="font-display text-2xl text-olive-900">
        Registar uma economia
      </h2>
      <p className="mt-2 text-sm leading-6 text-olive-700">
        Ajude-nos a registar o valor poupado nesta visita.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-semibold text-olive-900">
          Valor da fatura
          <input
            name="total_bill_amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            required
            className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
            placeholder="€ 0,00"
          />
        </label>
        <label className="text-sm font-semibold text-olive-900">
          Desconto obtido
          <input
            name="discount_amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            required
            className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
            placeholder="€ 0,00"
          />
        </label>
        <label className="text-sm font-semibold text-olive-900">
          Categoria
          <select
            name="category"
            defaultValue={defaultCategory}
            className="mt-2 min-h-11 w-full rounded-xl bg-white px-4 outline-none"
          >
            <option>Gastronomia</option>
            <option>Experiências</option>
            <option>Alojamento</option>
            <option>Lazer</option>
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-wine-700 mt-4 text-sm">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-4 text-sm font-semibold text-olive-700">
          Economia registada com sucesso.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className="bg-wine-700 mt-5 min-h-11 rounded-full px-6 py-3 text-sm font-semibold text-white"
      >
        {saving ? "A guardar…" : "Guardar economia"}
      </button>
    </form>
  );
}
