"use client";

import { useRef } from "react";

interface PhotoPickerProps {
  photo: string | null;
  fileName: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}

/** Tap to take or choose a photo, or drop one in */
export default function PhotoPicker({ photo, fileName, onPick, onRemove }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
      <label htmlFor="photo" className="mb-4 block text-lg font-semibold text-gray-900">
        Plant Photo *
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file?.type.startsWith("image/")) onPick(file);
        }}
        onDragOver={(event) => event.preventDefault()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          photo
            ? "border-[#136207] bg-primary-50"
            : "border-gray-300 hover:border-[#136207] hover:bg-primary-50"
        }`}
      >
        <input
          id="photo"
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onPick(file);
            // Picking the same file again should still trigger a change
            event.target.value = "";
          }}
          className="hidden"
        />

        {photo ? (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- a local preview (data URL) */}
            <img src={photo} alt="Preview" className="mx-auto max-h-64 rounded-lg shadow-md" />
            {fileName && <p className="text-sm text-gray-600">{fileName}</p>}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl">📷</div>
            <div>
              <p className="text-lg font-medium text-gray-700">Tap to take or choose a photo</p>
              <p className="mt-1 text-sm text-gray-500">or drag and drop one here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
