import Link from "next/link";
import { RatingDisplay } from "./rating-display";

export type BusinessCardData = {
  slug: string;
  name: string;
  category: string;
  kind: string;
  city: string;
  image: string;
  cuisine?: string | null;
  priceRange?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  benefit?: string | null;
};

export function BusinessCard({ place }: { place: BusinessCardData }) {
  return (
    <article className="group bg-cream-100 overflow-hidden rounded-2xl border border-olive-900/10 transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image */}
      <div
        className="relative h-48 bg-cover bg-center sm:h-52"
        style={{ backgroundImage: `url(${place.image})` }}
        role="img"
        aria-label={`Imagem de ${place.name}`}
      >
        <button
          type="button"
          aria-label={`Adicionar ${place.name} aos favoritos`}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/90 text-[17px] text-olive-900 shadow-sm transition hover:bg-white active:scale-95"
        >
          ♡
        </button>
        {place.benefit && (
          <span className="bg-gold-500 absolute bottom-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest text-olive-900 uppercase">
            Clube
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-wine-700 text-[10px] font-bold tracking-[0.2em] uppercase">
              {place.kind}
            </p>
            <h2 className="font-display mt-1.5 text-[1.35rem] leading-tight text-olive-900">
              {place.name}
            </h2>
          </div>
          {place.priceRange && (
            <span className="shrink-0 pt-1 text-xs font-semibold text-olive-600">
              {place.priceRange}
            </span>
          )}
        </div>

        <div className="mt-2.5">
          <RatingDisplay
            rating={place.rating}
            reviewCount={place.reviewCount}
          />
        </div>

        <p className="mt-2 text-sm text-olive-600">
          {[place.cuisine, place.city].filter(Boolean).join(" · ")}
        </p>

        {place.benefit && (
          <p className="bg-gold-500/10 mt-3.5 rounded-xl px-3 py-2 text-sm font-medium text-olive-900">
            {place.benefit}
          </p>
        )}

        <Link
          href={`/explorar/${place.slug}`}
          className="text-wine-700 decoration-gold-500 hover:text-wine-800 mt-4 flex min-h-[44px] items-center text-sm font-semibold underline underline-offset-4 transition-colors"
        >
          Ver ficha{" "}
          <span aria-hidden="true" className="ml-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
