import type { LoyaltyHistoryItem } from "@/types/loyalty";

const SOURCE_LABELS: Record<string, string> = {
  MAIN_BENEFIT: "Benefício principal",
  REGULAR_VISIT: "Visita",
  LOYALTY_REWARD: "Recompensa",
  MANUAL: "Registo manual",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

// Histórico de visitas validadas do membro neste programa.
export function LoyaltyHistory({ items }: { items: LoyaltyHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-olive-600">Ainda não tem visitas registadas.</p>
    );
  }

  return (
    <ul className="divide-y divide-olive-900/5">
      {items.map((item) => (
        <li
          key={item.visitId}
          className="flex items-center justify-between py-2.5 text-sm"
        >
          <span className="text-olive-800">
            {SOURCE_LABELS[item.sourceType] ?? item.sourceType}
          </span>
          <span className="flex items-center gap-3">
            <span className="text-olive-600">{formatDate(item.visitDate)}</span>
            {item.stampIssued ? (
              <span className="bg-gold-500 h-2.5 w-2.5 rounded-full" aria-label="Selo emitido" />
            ) : (
              <span
                className="h-2.5 w-2.5 rounded-full border border-olive-900/25"
                aria-label="Sem selo"
              />
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}