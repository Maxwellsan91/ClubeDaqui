// Progresso de selos: ● ● ● ○ ○  —  identidade Clube Daqui (premium, sóbrio).
export function StampProgress({
  current,
  required,
  showLabel = true,
}: {
  current: number;
  required: number;
  showLabel?: boolean;
}) {
  const total = Math.max(required, current, 1);
  const filled = Math.min(current, total);
  const dots = Array.from({ length: total }, (_, i) => i < filled);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="img"
        aria-label={`${current} de ${required} selos`}
      >
        {dots.map((on, i) => (
          <span
            key={i}
            className={
              on
                ? "h-3.5 w-3.5 rounded-full bg-gold-500 shadow-[0_0_0_2px_rgba(0,0,0,0.04)]"
                : "h-3.5 w-3.5 rounded-full border border-olive-900/25 bg-transparent"
            }
          />
        ))}
      </div>
      {showLabel ? (
        <p className="text-sm font-medium text-olive-700">
          <span className="font-semibold text-olive-900">{current}</span> de{" "}
          {required} selos
        </p>
      ) : null}
    </div>
  );
}