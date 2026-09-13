"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

interface ReviewFormProps {
  businessSlug: string;
  businessName: string;
}

export default function ReviewForm({
  businessSlug,
  businessName,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0 || status === "saving") return;

    setStatus("saving");

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessSlug}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ rating, comment }),
        },
      );

      if (!res.ok) throw new Error("Request failed");

      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (status === "saved") {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-lg font-semibold text-olive-900">
          Obrigado pela avaliação!
        </p>
        <p className="text-sm text-olive-600">
          A sua opinião ajuda outros membros a escolher melhor.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm font-medium text-olive-700">
        A sua avaliação de <span className="font-semibold">{businessName}</span>
      </p>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = (hovered || rating) >= star;
          return (
            <button
              key={star}
              type="button"
              aria-label={`${star} estrela${star !== 1 ? "s" : ""}`}
              className={`min-h-[44px] min-w-[44px] text-3xl leading-none transition-colors ${
                filled ? "text-gold-500" : "text-olive-900/20"
              }`}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Partilhe a sua experiência (opcional)"
        rows={4}
        className="bg-cream-50 focus:border-wine-700 w-full resize-none rounded-xl border border-olive-900/20 px-4 py-3 text-sm text-olive-900 placeholder:text-olive-600/60 focus:outline-none"
      />

      {status === "error" && (
        <p className="text-wine-700 text-sm">
          Não foi possível guardar. Tente novamente.
        </p>
      )}

      <button
        type="submit"
        disabled={rating === 0 || status === "saving"}
        className="text-cream-50 rounded-xl bg-olive-900 px-6 py-3 text-sm font-semibold transition-opacity disabled:opacity-40"
      >
        {status === "saving" ? "A guardar…" : "Enviar avaliação"}
      </button>
    </form>
  );
}
