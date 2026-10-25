"use client";

import { useLanguage } from "@/components/LanguageProvider";

export interface PlantIdResult {
  prediction: string;
  scientificName: string | null;
  isKnownPlant: boolean;
}

interface PlantIdSuggestionProps {
  online: boolean;
  identifying: boolean;
  result: PlantIdResult | null;
  /** The species the user picked, compared with the suggestion once they've chosen */
  chosen: string;
  compare: boolean;
  onUseSuggestion: (plantName: string) => void;
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-[#136207]" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/** The plant ID model's suggestion for the photo. The user's choice is what's saved. */
export default function PlantIdSuggestion({
  online,
  identifying,
  result,
  chosen,
  compare,
  onUseSuggestion,
}: PlantIdSuggestionProps) {
  const { t } = useLanguage();
  const matches = result && chosen.toLowerCase() === result.prediction.toLowerCase();

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
      <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
        🤖 {t("AI Plant Identification")}
      </h2>

      {identifying ? (
        <div className="flex items-center space-x-3 text-gray-600" role="status">
          <Spinner />
          <span>{t("Analyzing image...")}</span>
        </div>
      ) : result ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#136207]">
              {t("AI Identification")}
            </span>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {result.prediction}
              {result.scientificName && (
                <span className="ml-2 text-base font-normal text-gray-600">
                  ({result.scientificName})
                </span>
              )}
            </p>
          </div>

          {compare && chosen && (
            <div
              className={`rounded-lg p-4 ${
                matches
                  ? "border border-primary-300 bg-primary-100"
                  : "border border-orange-300 bg-orange-100"
              }`}
            >
              {matches ? (
                <p className="font-medium text-[#136207]">
                  ✅ {t("Your selection matches the AI prediction!")}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-orange-700">
                    ⚠️{" "}
                    {t(
                      "Your selection ({chosen}) differs from AI prediction ({prediction}). Your selection will be saved.",
                      {
                        chosen,
                        prediction: result.prediction,
                      },
                    )}
                  </p>
                  {result.isKnownPlant && (
                    <button
                      type="button"
                      onClick={() => onUseSuggestion(result.prediction)}
                      className="text-sm font-semibold text-[#136207] underline"
                    >
                      {t("Use AI suggestion instead")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : online ? (
        <p className="text-gray-500">
          {t("Unable to identify plant. Please select manually below.")}
        </p>
      ) : (
        <p className="text-gray-500">
          {t(
            "AI suggestions need a connection. Save this as a draft to get one when you finish it later, or pick the plant yourself.",
          )}
        </p>
      )}
    </div>
  );
}
