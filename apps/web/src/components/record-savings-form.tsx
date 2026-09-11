"use client";

import { FormEvent, useState } from "react";
import type { SavingsCategory, SavingsRecord } from "@/types/member";

export function RecordSavingsForm({
  onSaved,
}: {
  onSaved: (record: SavingsRecord) => void;
}) {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    onSaved({
      id: crypto.randomUUID(),
      businessName: "Benefício utilizado",
      businessSlug: "explorar",
      category: form.get("category") as SavingsCategory,
      redeemedAt: new Date().toISOString(),
      totalBillAmount: total,
      discountAmount: discount,
    });
    event.currentTarget.reset();
    setError("");
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
            defaultValue="Gastronomia"
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
      <button
        type="submit"
        className="bg-wine-700 mt-5 min-h-11 rounded-full px-6 py-3 text-sm font-semibold text-white"
      >
        Guardar economia
      </button>
    </form>
  );
}
