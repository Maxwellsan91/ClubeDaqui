import Link from "next/link";

export function ClubBenefitCard({
  title,
  description,
  terms,
  compact = false,
  hideCta = false,
}: {
  title?: string | null;
  description?: string | null;
  terms?: string | null;
  compact?: boolean;
  hideCta?: boolean;
}) {
  return (
    <div
      className={`border-gold-500/40 bg-gold-500/10 rounded-2xl border p-5 ${compact ? "" : "p-6 sm:p-8"}`}
    >
      <p className="text-wine-700 text-xs font-semibold tracking-[0.2em] uppercase">
        Benefício Clube
      </p>
      <p className="font-display mt-3 text-2xl text-olive-900">
        {title ?? "Benefício a anunciar"}
      </p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-olive-700">{description}</p>
      ) : null}
      {terms ? (
        <ul className="mt-3 space-y-1.5">
          {terms.split("\n").filter(Boolean).map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-5 text-olive-600">
              <span className="mt-0.5 shrink-0 text-gold-500">—</span>
              <span>{line.trim()}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!hideCta && (
        <Link
          href="/registar"
          className="bg-wine-700 mt-5 inline-flex min-h-11 items-center rounded-full px-5 py-3 text-sm font-semibold text-white"
        >
          Aderir ao Clube
        </Link>
      )}
    </div>
  );
}
