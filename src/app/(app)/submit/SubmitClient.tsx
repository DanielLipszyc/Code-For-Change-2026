"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useOnline } from "@/client/offline/hooks";
import { getSavedReport, saveReport, type SavedReport } from "@/client/offline/reports";
import { sendSavedReport } from "@/client/offline/send";
import { PHOTO_MAX_SIZE, PHOTO_QUALITY, compressImage, readFileAsDataUrl } from "@/client/images";
import { plants } from "@/data/plants";
import { PLANT_ID_ENABLED } from "@/lib/features";
import { MAX_NOTES_LENGTH } from "@/lib/limits";
import LocationField, { type ReportLocation } from "./_components/LocationField";
import PhotoPicker from "./_components/PhotoPicker";
import PlantIdSuggestion, { type PlantIdResult } from "./_components/PlantIdSuggestion";

const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 30_000,
};

function getGpsLocation(): Promise<ReportLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser can't share its location"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracyM: coords.accuracy,
          source: "gps",
        }),
      reject,
      GPS_OPTIONS,
    );
  });
}

/**
 * /submit: report a sighting. Works offline: every report is saved on the
 * device first and then sent, so nothing is lost to a dropped connection.
 * Without a connection it waits in Drafts and sends itself later
 * (components/SavedReportsSync). "Save as draft" keeps it to finish later,
 * e.g. to get an AI suggestion once back online. /submit?draft=<id> opens one.
 */
export default function SubmitClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plantParam = searchParams.get("plant");
  // draftId: links from the earlier offline mode
  const draftParam = searchParams.get("draft") ?? searchParams.get("draftId");
  const { user, isLoaded } = useUser();
  const toast = useToast();
  const online = useOnline();

  const [draft, setDraft] = useState<SavedReport | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [plantName, setPlantName] = useState("");
  const [notes, setNotes] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [location, setLocation] = useState<ReportLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [plantId, setPlantId] = useState<PlantIdResult | null>(null);
  const [compare, setCompare] = useState(false);
  const [saving, setSaving] = useState<"send" | "draft" | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // The report's ID from the moment it's first saved, so saving or sending it
  // again updates the same report instead of making another
  const reportIdRef = useRef<string | null>(null);

  const identifyPlant = useCallback(async (image: string) => {
    if (!PLANT_ID_ENABLED || !navigator.onLine) return;
    setIdentifying(true);
    setPlantId(null);
    try {
      const response = await fetch("/api/identify-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: await compressImage(image, 512, 0.5) }),
      });
      if (!response.ok) return;
      const result: PlantIdResult = await response.json();
      setPlantId(result);
      // Pre-select the AI's match only if the user hasn't chosen a species yet
      if (result.isKnownPlant) {
        setPlantName((current) => (current && current !== "Unknown" ? current : result.prediction));
      }
    } catch (error) {
      console.error("Error identifying plant:", error);
    } finally {
      setIdentifying(false);
    }
  }, []);

  // Prefill from /submit?plant=... (the guide's "Report this plant")
  useEffect(() => {
    if (!plantParam) return;
    const value = plants.some((p) => p.name === plantParam) ? plantParam : "Unknown";
    setPlantName((current) => current || value);
  }, [plantParam]);

  // Open a saved report from /submit?draft=...
  useEffect(() => {
    if (!draftParam) return;
    let cancelled = false;
    (async () => {
      const saved = await getSavedReport(draftParam);
      if (cancelled) return;
      if (!saved) {
        toast.error("That draft isn't saved on this device.");
        return;
      }
      reportIdRef.current = saved.id;
      setDraft(saved);
      setPlantName(saved.plantName ?? "");
      setNotes(saved.notes);
      setAnonymous(saved.anonymous);
      setLocation({
        lat: saved.lat,
        lng: saved.lng,
        accuracyM: saved.locationAccuracyM,
        source: "saved",
      });
      // Drafts from the earlier offline mode kept the photo at full size
      const image = await compressImage(saved.photo, PHOTO_MAX_SIZE, PHOTO_QUALITY).catch(
        () => saved.photo,
      );
      if (cancelled) return;
      setPhoto(image);
      if (!saved.plantName) identifyPlant(image);
    })().catch(() => toast.error("Couldn't open that draft."));
    return () => {
      cancelled = true;
    };
  }, [draftParam, identifyPlant, toast]);

  // Signed-out visitors can only submit anonymously
  useEffect(() => {
    if (isLoaded && !user) setAnonymous(true);
  }, [isLoaded, user]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => router.push("/map"), 2000);
    return () => clearTimeout(timer);
  }, [showSuccess, router]);

  async function handlePhoto(file: File) {
    setFileName(file.name);
    try {
      const image = await compressImage(
        await readFileAsDataUrl(file),
        PHOTO_MAX_SIZE,
        PHOTO_QUALITY,
      );
      setPhoto(image);
      setPlantId(null);
      setCompare(false);
      identifyPlant(image);
    } catch (error) {
      setFileName("");
      toast.error(error instanceof Error ? error.message : "Couldn't read that photo.");
    }
  }

  async function locateWithGps(): Promise<ReportLocation | null> {
    setLocating(true);
    try {
      const where = await getGpsLocation();
      setLocation(where);
      return where;
    } catch {
      setShowMap(true);
      toast.error("Couldn't get your location. Tap the spot on the map instead.");
      return null;
    } finally {
      setLocating(false);
    }
  }

  async function handleSave(mode: "send" | "draft") {
    if (!photo) {
      toast.error("Please add a photo of the plant.");
      return;
    }
    if (mode === "send" && !plantName) {
      toast.error("Please choose the plant, or Unknown / Other.");
      return;
    }

    setSaving(mode);
    try {
      const where = location ?? (await locateWithGps());
      if (!where) return;

      reportIdRef.current ??= crypto.randomUUID();
      const report: SavedReport = {
        id: reportIdRef.current,
        status: mode === "draft" ? "draft" : "queued",
        ownerId: user?.id ?? draft?.ownerId ?? null,
        savedAt: Date.now(),
        observedAt: draft?.observedAt ?? Date.now(),
        photo,
        lat: where.lat,
        lng: where.lng,
        locationAccuracyM: where.accuracyM,
        plantName: plantName || null,
        notes,
        anonymous,
        lastError: null,
      };

      try {
        // Kept on the device until the server has it
        await saveReport(report);
      } catch {
        // Storage unavailable (some private windows): a draft can't be kept,
        // but a report can still be sent directly
        if (mode === "draft" || !navigator.onLine) {
          toast.error("This browser won't let the app save reports on the device.");
          return;
        }
      }

      if (mode === "draft") {
        toast.success("Draft saved. Finish it from Drafts.");
        router.push("/drafts");
        return;
      }

      const result = navigator.onLine
        ? await sendSavedReport(report)
        : ({ status: "offline" } as const);
      if (result.status === "sent") {
        setShowSuccess(true);
      } else if (result.status === "offline") {
        toast.success(
          "No connection right now. Your report is saved and will be sent automatically.",
        );
        router.push("/drafts");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  const busy = saving !== null;

  return (
    <div className="min-h-screen bg-primary-50 px-4 py-12 sm:px-6 lg:px-8">
      {showSuccess && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-fade-in-out flex flex-col items-center gap-4 rounded-2xl bg-[#136207] px-12 py-8 text-white shadow-2xl">
            <div className="text-6xl">✅</div>
            <div className="text-center">
              <p className="mb-2 text-3xl font-bold">Success!</p>
              <p className="text-lg opacity-90">Plant submitted successfully</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
            {draft ? "Finish your report 🌱" : "Submit a Plant 🌱"}
          </h1>
          <p className="text-xl text-gray-600">
            Upload a photo of a plant you spotted in a swamp or wetland
          </p>
        </div>

        {!online && (
          <div
            className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-6 py-4 text-amber-900 shadow-sm"
            role="status"
          >
            <p className="font-semibold">You&apos;re offline.</p>
            <p className="mt-1 text-sm">
              You can still fill this in. Your report is saved on this device and sent automatically
              when you&apos;re back online.
            </p>
          </div>
        )}

        {isLoaded && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 shadow-sm ${
              user ? "border-slate-200 bg-white" : "border-sky-200 bg-sky-50"
            }`}
          >
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={anonymous}
                disabled={!user}
                onChange={(event) => setAnonymous(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#136207] focus:ring-[#136207]"
              />
              {user ? "Submit anonymously instead of using my account name" : "Submit anonymously"}
            </label>
            {!user && (
              <p className="mt-2 text-sm text-sky-800">
                Your report will be added without a user profile or name attached.
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave("send");
          }}
          className="space-y-6"
        >
          <PhotoPicker
            photo={photo}
            fileName={fileName}
            onPick={handlePhoto}
            onRemove={() => {
              setPhoto(null);
              setFileName("");
              setPlantId(null);
              setCompare(false);
            }}
          />

          {PLANT_ID_ENABLED && photo && (
            <PlantIdSuggestion
              online={online}
              identifying={identifying}
              result={plantId}
              chosen={plantName}
              compare={compare}
              onUseSuggestion={setPlantName}
            />
          )}

          <div className="space-y-6 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
            <div>
              <label htmlFor="plantName" className="mb-2 block text-sm font-medium text-gray-700">
                Select Plant Species *
              </label>
              {plantParam && (
                <p className="mb-2 text-sm text-emerald-700">
                  Prefilled from guide: <b>{plantParam}</b>
                </p>
              )}
              <select
                id="plantName"
                value={plantName}
                onChange={(event) => {
                  setPlantName(event.target.value);
                  if (plantId && event.target.value) setCompare(true);
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-transparent focus:ring-2 focus:ring-[#136207]"
              >
                <option value="">-- Select a plant --</option>
                {plants.map((plant) => (
                  <option key={plant.name} value={plant.name}>
                    {plant.name} ({plant.scientificName})
                  </option>
                ))}
                <option value="Unknown">Unknown / Other</option>
              </select>
              {plantId?.isKnownPlant && !plantName && (
                <p className="mt-2 text-sm text-[#136207]">💡 AI suggests: {plantId.prediction}</p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={MAX_NOTES_LENGTH}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-colors focus:border-transparent focus:ring-2 focus:ring-[#136207]"
                placeholder="Describe the habitat, water conditions, nearby plants..."
              />
            </div>
          </div>

          <LocationField
            value={location}
            onChange={setLocation}
            locating={locating}
            onUseGps={locateWithGps}
            showMap={showMap}
            onShowMap={setShowMap}
          />

          <div className="space-y-3">
            <button
              type="submit"
              disabled={!photo || !plantName || busy}
              className="flex w-full items-center justify-center rounded-xl bg-[#136207] px-6 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-[#0f5006] disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving === "send"
                ? online
                  ? "Submitting…"
                  : "Saving…"
                : online
                  ? "🌿 Submit Plant"
                  : "💾 Save, and send when I'm back online"}
            </button>
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={!photo || busy}
              className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving === "draft" ? "Saving…" : "Save as draft, finish later"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
