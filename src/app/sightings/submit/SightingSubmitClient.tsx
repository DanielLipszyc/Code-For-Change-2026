"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { plants } from "@/data/plants";

export default function SightingSubmitClient() {
  const router = useRouter();

  const [speciesId, setSpeciesId] = useState("");
  const [notes, setNotes] = useState("");
  const [addressApprox, setAddressApprox] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState("");

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setLocationError("Unable to retrieve your location. Please enable location services.");
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!location) {
        setLocationError("Please get your location before submitting");
        setIsSubmitting(false);
        return;
      }

      // Check if location is within Alachua County bounds
      if (
        location.lat < 29.3 || location.lat > 29.9 ||
        location.lng < -82.7 || location.lng > -82.0
      ) {
        setLocationError("Location must be within Alachua County");
        setIsSubmitting(false);
        return;
      }

      const sighting = {
        speciesId: speciesId || null,
        lat: location.lat,
        lng: location.lng,
        locationAccuracyM: location.accuracy,
        addressApprox: addressApprox || null,
        observedAt: new Date().toISOString(),
        reportedAt: new Date().toISOString(),
        notes: notes || "",
        status: "pending",
      };

      const response = await fetch("/api/sightings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sighting),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to save sighting");
      }

      // Show success notification, then redirect to sightings list
      setShowSuccess(true);
    } catch (error) {
      console.error("Error submitting sighting:", error);
      alert("Unable to submit sighting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to sightings list after success notification
  if (showSuccess) {
    setTimeout(() => {
      router.push('/sightings');
    }, 2000);
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-primary-50">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-[#136207] text-white px-12 py-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-fade-in-out">
            <div className="text-6xl">✅</div>
            <div className="text-center">
              <p className="font-bold text-3xl mb-2">Success!</p>
              <p className="text-lg opacity-90">Sighting submitted successfully</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Submit a Sighting 🌱
          </h1>
          <p className="text-xl text-gray-600">
            Report a plant sighting in Alachua County
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📍</div>
            <div>
              <p className="font-semibold text-amber-900">
                Location must be within Alachua County
              </p>
              <p className="text-sm text-amber-800 mt-1">
                Sightings are limited to Alachua County. Please enable location services and click "Get My Location" before submitting.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Location Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Location *
            </label>

            <div className="space-y-4">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#136207] hover:bg-[#0f5006] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                📍 Get My Location
              </button>

              {locationError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{locationError}</p>
                </div>
              )}

              {location && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <p className="text-sm text-emerald-700">
                    <strong>Location captured:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    {location.accuracy && <span> (±{location.accuracy.toFixed(0)}m)</span>}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Species Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
            <div>
              <label htmlFor="speciesId" className="block text-sm font-medium text-gray-700 mb-2">
                Plant Species (Optional)
              </label>

              <select
                id="speciesId"
                value={speciesId}
                onChange={(e) => setSpeciesId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#136207] focus:border-transparent transition-colors"
              >
                <option value="">-- Select a plant (optional) --</option>
                {plants.map((plant) => (
                  <option key={plant.name} value={plant.name.toLowerCase().replace(/\s+/g, "_")}>
                    {plant.name} ({plant.scientificName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="addressApprox" className="block text-sm font-medium text-gray-700 mb-2">
                Approximate Address (Optional)
              </label>
              <input
                id="addressApprox"
                type="text"
                value={addressApprox}
                onChange={(e) => setAddressApprox(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#136207] focus:border-transparent transition-colors"
                placeholder="e.g., Near Depot Park, Gainesville"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#136207] focus:border-transparent transition-colors resize-none"
                placeholder="Describe the habitat, conditions, nearby landmarks..."
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!location || isSubmitting}
            className="w-full py-4 px-6 bg-[#136207] hover:bg-[#0f5006] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center text-lg"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              <>🌿 Submit Sighting</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
