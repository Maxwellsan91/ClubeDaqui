export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="bg-cream-100/60 rounded-3xl border border-dashed border-olive-900/20 px-6 py-12 text-center">
      <p className="font-display text-2xl text-olive-900">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-olive-700">
          {description}
        </p>
      ) : null}
    </div>
  );
}
