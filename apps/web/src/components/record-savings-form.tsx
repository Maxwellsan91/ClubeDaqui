"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { SavingsCategory, SavingsRecord } from "@/types/member";

export function RecordSavingsForm({
  onSaved,
  redemptionId,
  businessName = "Estabelecimento",
  businessSlug = "explorar",
}: {
  onSaved: (record: SavingsRecord) => void;
  redemptionId: string;
  businessName?: string;
  businessSlug?: string;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const total = Number(form.get("total_bill_amount"));
    const discount = Number(form.get("discount_amount"));

    if (
      !Number.isFinite(total) ||
      !Number.isFinite(discount) ||
      total <= 0 ||
      discount < 0 ||
      discount > total
    ) {
      setError(
        "Verifique os valores. O desconto não pode ser superior à fatura.",
      );
      return;
    }

    setError("");
    setSaving(true);
    try {
      const response = await fetch(
        `/api/me/redemptions/${redemptionId}/financials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            total_bill_amount: total,
            discount_amount: discount,
          }),
        },
      );
      if (!response.ok) throw new Error("api error");
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
      setSaving(false);
      return;
    }

    onSaved({
      id: redemptionId,
      redemptionId,
      businessName,
      businessSlug,
      category: "Gastronomia" as SavingsCategory,
      redeemedAt: new Date().toISOString(),
      totalBillAmount: total,
      discountAmount: discount,
    });
    setSaving(false);
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="bg-cream-100 rounded-2xl border border-olive-900/10 p-6">
        <div className="flex items-start gap-3">
          <span
            className="text-cream-50 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-olive-900 text-sm"
            aria-hidden="true"
          >
            ✓
          </span>
          <div>
            <p className="font-semibold text-olive-900">Poupança registada.</p>
            <p className="mt-1 text-sm leading-6 text-olive-700">
              A sua economia em{" "}
              <span className="font-semibold">{businessName}</span> ficou
              guardada. Agora partilhe a sua experiência — a sua avaliação ajuda
              outros membros a escolher melhor.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Link
            href={`/explorar/${businessSlug}#avaliar`}
            className="bg-wine-700 hover:bg-wine-800 inline-flex min-h-[44px] items-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition"
          >
            Avaliar {businessName} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-cream-100 rounded-2xl border border-olive-900/10 p-6"
    >
      <p className="text-sm text-olive-700">
        Quanto pagou e quanto poupou com o benefício do Clube?
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`total-${redemptionId}`}
            className="block text-sm font-semibold text-olive-900"
          >
            Valor da fatura
          </label>
          <div className="relative mt-1.5">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-olive-600">
              €
            </span>
            <input
              id={`total-${redemptionId}`}
              name="total_bill_amount"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              required
              className="focus:border-wine-700 block w-full rounded-xl border border-olive-900/12 bg-white py-3 pr-4 pl-8 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
              placeholder="0,00"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor={`discount-${redemptionId}`}
            className="block text-sm font-semibold text-olive-900"
          >
            Desconto obtido
          </label>
          <div className="relative mt-1.5">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-olive-600">
              €
            </span>
            <input
              id={`discount-${redemptionId}`}
              name="discount_amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              required
              className="focus:border-wine-700 block w-full rounded-xl border border-olive-900/12 bg-white py-3 pr-4 pl-8 text-olive-900 transition-colors placeholder:text-olive-700/40 focus:outline-none"
              placeholder="0,00"
            />
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-wine-700 mt-3 text-sm">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-olive-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-900/90 disabled:opacity-60"
      >
        {saving ? "A guardar…" : "Guardar poupança"}
      </button>
    </form>
  );
}
