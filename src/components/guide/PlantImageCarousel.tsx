"use client";

import { useState } from "react";
import type { PlantImage } from "@/types/plant";

interface Props {
  images: PlantImage[];
  name: string;
}

export default function PlantImageCarousel({ images, name }: Props) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const current = images[index % images.length];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.caption || name}
          className="aspect-[16/10] w-full object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow"
            >
              &#10094;
            </button>

            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow"
            >
              &#10095;
            </button>
          </>
        )}
      </div>

      {current.caption && <p className="text-center text-sm text-slate-600">{current.caption}</p>}

      {images.length > 1 && (
        <p className="text-center text-xs text-slate-500">
          {index + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
