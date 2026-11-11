"use client";

import { useEffect, useState } from "react";
import type { PlantImage } from "@/types/plant";

interface Props {
  images: PlantImage[];
  name: string;
  thumbnail?: string | null;
}

const FALLBACK_IMG =
  "data:image/svg+xml," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#475569">Image unavailable</text></svg>');

function usableUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export default function PlantImageCarousel({ images, name, thumbnail }: Props) {
  const validImages = images.filter((image) => usableUrl(image.url));
  // Use the original thumbnail when no additional photos have been recorded.
  const slides = validImages.length
    ? validImages
    : usableUrl(thumbnail)
      ? [{ url: thumbnail, caption: "" }]
      : [];
  const [index, setIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  useEffect(() => {
    setIndex(0);
    setFailedUrls([]);
  }, [images, thumbnail]);

  const current = slides[index % Math.max(slides.length, 1)];
  const src = current && !failedUrls.includes(current.url) ? current.url : usableUrl(thumbnail) && !failedUrls.includes(thumbnail) ? thumbnail : FALLBACK_IMG;
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- external plant reference images */}
        <img
          key={src}
          src={src}
          alt={current?.caption || name}
          className="aspect-[16/10] w-full object-contain"
          onError={() => {
            if (src !== FALLBACK_IMG) setFailedUrls((previous) => previous.includes(src) ? previous : [...previous, src]);
          }}
        />
        {slides.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow">
              &#10094;
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow">
              &#10095;
            </button>
          </>
        )}
      </div>
      {current?.caption && <p className="text-center text-sm text-slate-600">{current.caption}</p>}
      {slides.length > 1 && <p className="text-center text-xs text-slate-500">{index + 1} / {slides.length}</p>}
    </div>
  );
}
