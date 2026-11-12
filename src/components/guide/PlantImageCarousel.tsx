"use client";

import { useState } from "react";
import type { PlantImage } from "@/types/plant";
import { useLanguage } from "@/components/LanguageProvider";

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
  const { t } = useLanguage();
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const validImages = images.filter((image) => usableUrl(image.url));
  const slides = validImages.length
    ? validImages
    : usableUrl(thumbnail)
      ? [{ url: thumbnail, caption: "" }]
      : [];
  const photos = slides.length ? slides : [{ url: FALLBACK_IMG, caption: "" }];
  const count = photos.length;
  const columns = count === 1 ? 1 : 2;
  const rows = Math.ceil(count / columns);

  return (
    <div
      className="grid h-full min-h-[320px] gap-1 overflow-hidden rounded-xl bg-slate-100 sm:min-h-[420px]"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(140px, 1fr))`,
      }}
    >
      {photos.map((photo, index) => {
        const src = failedUrls.includes(photo.url)
          ? usableUrl(thumbnail) && !failedUrls.includes(thumbnail)
            ? thumbnail
            : FALLBACK_IMG
          : photo.url;

        return (
          <div key={`${photo.url}-${index}`} className="relative min-h-0 overflow-hidden bg-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- external plant reference images */}
            <img
              src={src}
              alt={photo.caption ? t(photo.caption) : `${name} — ${index + 1}`}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => {
                if (src !== FALLBACK_IMG) {
                  setFailedUrls((previous) =>
                    previous.includes(src) ? previous : [...previous, src],
                  );
                }
              }}
            />
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-7 text-xs text-white">
                {t(photo.caption)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
