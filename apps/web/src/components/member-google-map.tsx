"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: {
            center: { lat: number; lng: number };
            zoom: number;
            mapId: string;
            streetViewControl: boolean;
            mapTypeControl: boolean;
          },
        ) => object;
        Marker: new (options: {
          map: object;
          position: { lat: number; lng: number };
          title: string;
          label: string;
        }) => object;
      };
    };
  }
}

const apiKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ??
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export function MemberGoogleMap({ center }: { center: [number, number] }) {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!element.current || !apiKey) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !element.current || !window.google?.maps) return;
      const map = new window.google.maps.Map(element.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: 13,
        mapId: "DEMO_MAP_ID",
        streetViewControl: false,
        mapTypeControl: false,
      });
      new window.google.maps.Marker({
        map,
        position: { lat: center[0], lng: center[1] },
        title: "A sua localização",
        label: "Você",
      });
    };
    if (window.google?.maps) {
      render();
      return () => {
        cancelled = true;
      };
    }
    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", render, { once: true });
      return () => {
        cancelled = true;
      };
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render, { once: true });
    document.head.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [center]);

  if (!apiKey) return null;
  return (
    <div
      ref={element}
      className="h-[28rem] w-full"
      aria-label="Mapa com a sua localização"
    />
  );
}
