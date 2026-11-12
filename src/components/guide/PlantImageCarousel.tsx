"use client";

import { useEffect, useState } from "react";
import type { PlantImage } from "@/types/plant";
import { useLanguage } from "@/components/LanguageProvider";

interface Props {
  images: PlantImage[];
  name: string;
  thumbnail?: string | null;
}

const FALLBACK_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#475569">Image unavailable</text></svg>',
  );

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
  const { t } = useLanguage();
  const validImages = images.filter((image) => usableUrl(image.url));
  // Use the original thumbnail when no additional photos have been recorded.
  const slides = validImages.length
    ? validImages
    : usableUrl(thumbnail)
      ? [{ url: thumbnail, caption: "" }]
      : [];
  const [index, setIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    setIndex(0);
    setFailedUrls([]);
    setExpanded(false);
    setZoom(1);
  }, [images, thumbnail]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const current = slides[index % Math.max(slides.length, 1)];
  const src =
    current && !failedUrls.includes(current.url)
      ? current.url
      : usableUrl(thumbnail) && !failedUrls.includes(thumbnail)
        ? thumbnail
        : FALLBACK_IMG;
  const go = (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length);

  return (
    <div className="flex h-full min-h-[320px] flex-col gap-3">
      <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- external plant reference images */}
        <img
          key={src}
          src={src}
          alt={current?.caption || name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => {
            if (src !== FALLBACK_IMG)
              setFailedUrls((previous) => (previous.includes(src) ? previous : [...previous, src]));
          }}
        />
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setExpanded(true);
          }}
          aria-label={t("View full image")}
          className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-2 shadow hover:bg-white"
        >
          ⛶
        </button>
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("Previous photo")}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow"
            >
              &#10094;
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("Next photo")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow"
            >
              &#10095;
            </button>
          </>
        )}
      </div>
      {current?.caption && (
        <p className="text-center text-sm text-slate-600">{t(current.caption)}</p>
      )}
      {slides.length > 1 && (
        <p className="text-center text-xs text-slate-500">
          {t("Photo {current} of {total}", { current: index + 1, total: slides.length })}
        </p>
      )}

      {expanded && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("View full image")}
        >
          <div className="flex justify-end gap-2 text-white">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              disabled={zoom <= 1}
              aria-label={t("Zoom out")}
              className="rounded bg-white/20 px-4 py-2 disabled:opacity-40"
            >
              −
            </button>
            <span className="self-center text-sm">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
              disabled={zoom >= 4}
              aria-label={t("Zoom in")}
              className="rounded bg-white/20 px-4 py-2 disabled:opacity-40"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label={t("Close")}
              className="ml-2 rounded bg-white/20 px-4 py-2"
            >
              ✕
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto">
            <div
              className="flex h-full w-full shrink-0 items-center justify-center"
              style={{ minWidth: `${zoom * 100}%`, minHeight: `${zoom * 100}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- external plant reference images */}
              <img
                src={src}
                alt={current?.caption || name}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-6 py-2 text-white">
              <button
                type="button"
                onClick={() => {
                  go(-1);
                  setZoom(1);
                }}
                aria-label={t("Previous photo")}
                className="rounded bg-white/20 px-4 py-2"
              >
                ❮
              </button>
              <span className="text-sm">
                {t("Photo {current} of {total}", { current: index + 1, total: slides.length })}
              </span>
              <button
                type="button"
                onClick={() => {
                  go(1);
                  setZoom(1);
                }}
                aria-label={t("Next photo")}
                className="rounded bg-white/20 px-4 py-2"
              >
                ❯
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
