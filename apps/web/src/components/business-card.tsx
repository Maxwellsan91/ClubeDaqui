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
    <article className="group bg-cream-100 overflow-hidden rounded-3xl border border-olive-900/10 transition hover:-translate-y-1 hover:shadow-lg">
      <div
        className="relative h-52 bg-cover bg-center"
        style={{ backgroundImage: `url(${place.image})` }}
        role="img"
        aria-label={`Imagem ilustrativa de ${place.name}`}
      >
        <button
          type="button"
          aria-label={`Adicionar ${place.name} aos favoritos`}
          className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/90 text-xl text-olive-900 shadow-sm transition hover:bg-white"
        >
          ♡
        </button>
        {place.benefit ? (
          <span className="bg-gold-500 absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-olive-900">
            CLUBE
          </span>
        ) : null}
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-wine-700 text-xs font-semibold tracking-[0.18em] uppercase">
              {place.kind}
            </p>
            <h2 className="font-display mt-2 text-2xl text-olive-900">
              {place.name}
            </h2>
          </div>
          {place.priceRange ? (
            <span className="text-sm font-semibold text-olive-600">
              {place.priceRange}
            </span>
          ) : null}
        </div>
        <div className="mt-3">
          <RatingDisplay
            rating={place.rating}
            reviewCount={place.reviewCount}
          />
        </div>
        <p className="mt-3 text-sm text-olive-700">
          {[place.cuisine, place.city].filter(Boolean).join(" · ")}
        </p>
        {place.benefit ? (
          <p className="bg-gold-500/10 mt-4 rounded-xl px-3 py-2 text-sm font-semibold text-olive-900">
            {place.benefit}
          </p>
        ) : null}
        <Link
          href={`/explorar/${place.slug}`}
          className="text-wine-700 decoration-gold-500 mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
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
