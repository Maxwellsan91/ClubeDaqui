"use client";

import { useEffect, useState } from "react";

function Countdown({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return (
    <span className={remaining <= 0 ? "text-wine-700" : "text-olive-600"}>
      {remaining <= 0
        ? "Código expirado"
        : `Válido por ${m}:${String(s).padStart(2, "0")} min`}
    </span>
  );
}

// Bilhete com o código de 6 dígitos que o membro mostra ao parceiro.
export function CodeTicket({
  code,
  hint,
}: {
  code: string;
  hint: string;
}) {
  return (
    <div className="bg-cream-100 rounded-2xl border border-olive-900/10 p-5">
      <div className="rounded-xl border border-olive-900/10 bg-white py-5 text-center">
        <p className="font-mono text-4xl font-bold tracking-[0.35em] text-olive-900">
          {code}
        </p>
        <p className="mt-2 text-xs">
          <Countdown seconds={5 * 60} />
        </p>
      </div>
      <p className="mt-3 text-sm leading-5 text-olive-600">{hint}</p>
    </div>
  );
}