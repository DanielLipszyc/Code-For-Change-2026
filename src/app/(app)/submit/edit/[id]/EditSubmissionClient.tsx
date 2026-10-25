"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { localizePlant, plants } from "@/data/plants";
import { MAX_NOTES_LENGTH } from "@/lib/limits";
import type { Submission } from "@/types/submission";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/components/LanguageProvider";

interface EditSubmissionClientProps {
  submission: Submission;
}

export default function EditSubmissionClient({ submission }: EditSubmissionClientProps) {
  const router = useRouter();
  const toast = useToast();
  const { language, t } = useLanguage();
  const locale = language === "pt" ? "pt-BR" : language;
  // "Unknown Plant" is stored for unidentified plants; the dropdown option is "Unknown"
  const [plantName, setPlantName] = useState(
    submission.plantName === "Unknown Plant" ? "Unknown" : submission.plantName,
  );
  const [notes, setNotes] = useState(submission.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(submission.hasPhoto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // The server looks up the scientific name from the plant list
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantName,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || t("Failed to update submission"));
      }

      toast.success(t("Changes saved."));
      router.push("/map");
    } catch (error) {
      console.error("Error updating submission:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("Failed to update submission. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-primary-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("Edit Submission")}</h2>
            <p className="text-gray-600">{t("Update the details of your plant sighting")}</p>
            <p className="text-sm text-amber-700 mt-2">
              {t("Saving changes sends your report back to an admin for review.")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plant Name Selection */}
            <div>
              <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-2">
                {t("Plant Name")}
              </label>
              <select
                id="plantName"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">{t("Select a plant...")}</option>
                {plants.map((plant) => (
                  <option key={plant.name} value={plant.name}>
                    {localizePlant(plant, language).name}
                    {plant.scientificName && ` (${plant.scientificName})`}
                  </option>
                ))}
                <option value="Unknown">{t("Unknown Plant")}</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                {t("Notes (Optional)")}
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={MAX_NOTES_LENGTH}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder={t("Add any observations or additional details...")}
              />
            </div>

            {/* Location Info (Read-only) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">
                {t("Location (Cannot be changed)")}
              </h3>
              <p className="text-sm text-gray-600">
                {t("Coordinates: {coordinates}", {
                  coordinates: `${submission.lat.toFixed(4)}, ${submission.lng.toFixed(4)}`,
                })}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t("Spotted: {date}", {
                  date: new Date(submission.timestamp).toLocaleString(locale),
                })}
              </p>
            </div>

            {/* Image Info (Read-only) */}
            {hasPhoto && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">{t("Photo")}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {t("Current photo (cannot be changed):")}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.photoUrl}
                  alt={submission.plantName}
                  className="w-full max-w-sm rounded-lg"
                  onError={() => setHasPhoto(false)}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/map")}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-[#136207] text-white rounded-lg font-medium hover:bg-[#0d4705] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? t("Saving...") : t("Save Changes")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
