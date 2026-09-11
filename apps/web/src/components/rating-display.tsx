type RatingDisplayProps = {
  rating?: number | null;
  reviewCount?: number | null;
};

export function RatingDisplay({ rating, reviewCount }: RatingDisplayProps) {
  if (!rating)
    return (
      <span className="text-sm text-olive-600">
        Avaliação ainda não disponível
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1 text-sm text-olive-700"
      aria-label={`${rating} de 5 estrelas`}
    >
      <span className="text-gold-500" aria-hidden="true">
        ★
      </span>
      <strong>{rating.toFixed(1)}</strong>
      {reviewCount ? <span>· {reviewCount} avaliações</span> : null}
    </span>
  );
}
