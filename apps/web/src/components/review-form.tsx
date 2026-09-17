"use client";

import { useState, FormEvent } from "react";

interface ReviewFormProps {
  redemptionId: string;
  businessName: string;
  onDone?: () => void;
}

export default function ReviewForm({
  redemptionId,
  businessName,
  onDone,
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
    try {
      const res = await fetch(`/api/me/redemptions/${redemptionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { message?: string };
        if (res.status === 409) {
          setStatus("saved");
          onDone?.();
          return;
        }
        throw new Error(json.message);
      }
      setStatus("saved");
      onDone?.();
    } catch {
      setStatus("error");
    }
  }

  if (status === "saved") {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-olive-700/10">
          <svg
            className="h-5 w-5 text-olive-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-semibold text-olive-900">Obrigado pela avaliação!</p>
        <p className="text-sm text-olive-600">
          A sua opinião ajuda outros membros a escolher melhor.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-4"
    >
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
              className={`min-h-[44px] min-w-[44px] text-3xl leading-none transition-colors ${filled ? "text-gold-500" : "text-olive-900/20"}`}
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
        rows={3}
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
