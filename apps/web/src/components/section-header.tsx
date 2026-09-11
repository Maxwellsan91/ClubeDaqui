export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-wine-700 text-xs font-semibold tracking-[0.25em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display mt-3 text-3xl tracking-tight text-olive-900 sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-olive-700">
          {description}
        </p>
      ) : null}
    </div>
  );
}
