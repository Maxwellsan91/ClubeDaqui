"use client";

import { useEffect, useRef, useState } from "react";
import type { BusinessCardData } from "./business-card";

const apiKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ??
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export function ExploreGoogleMap({
  places,
  center,
  userPosition,
  dark = true,
}: {
  places: BusinessCardData[];
  center: [number, number];
  userPosition?: [number, number] | null;
  dark?: boolean;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "missing"
  >("loading");
  useEffect(() => {
    if (!mapElement.current || !apiKey) {
      setStatus("missing");
      return;
    }
    let disposed = false;
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      if (!disposed) setStatus("error");
    };
    const draw = () => {
      if (
        disposed ||
        !mapElement.current ||
        !window.google?.maps ||
        typeof window.google.maps.Map !== "function"
      ) {
        if (!disposed) window.setTimeout(draw, 50);
        return;
      }
      const map = new window.google.maps.Map(mapElement.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: 13,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: true,
        zoomControl: true,
        colorScheme: dark ? "DARK" : "LIGHT",
      });
      if (userPosition) {
        new window.google.maps.Marker({
          map,
          position: { lat: userPosition[0], lng: userPosition[1] },
          title: "A sua localização",
          label: "Você",
        });
      }
      places.forEach((place) => {
        if (!place.coordinates) return;
        new window.google!.maps.Marker({
          map,
          position: { lat: place.coordinates[0], lng: place.coordinates[1] },
          title: place.name,
          label: "",
        });
      });
      setStatus("ready");
    };
    if (window.google?.maps) draw();
    else {
      const existing = document.getElementById("google-maps-script");
      if (existing) existing.addEventListener("load", draw, { once: true });
      else {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
        script.async = true;
        script.defer = true;
        script.addEventListener("load", draw, { once: true });
        script.addEventListener("error", () => setStatus("error"), {
          once: true,
        });
        document.head.appendChild(script);
      }
    }
    return () => {
      disposed = true;
      window.gm_authFailure = previousAuthFailure;
    };
  }, [center, dark, places, userPosition]);
  return (
    <div className="absolute inset-0" aria-label="Mapa de parceiros">
      <div ref={mapElement} className="absolute inset-0" />
      {status !== "ready" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#202124] p-6 text-center text-sm text-white/80">
          {status === "missing"
            ? "Configure a chave Google Maps no ambiente da aplicação."
            : status === "error"
              ? "Não foi possível carregar o Google Maps. Verifique a chave e as restrições do domínio."
              : "A carregar o mapa…"}
        </div>
      )}
    </div>
  );
}
