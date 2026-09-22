"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { plants } from "@/data/plants";

interface Sighting {
  _id: string;
  speciesId?: string | null;
  lat: number;
  lng: number;
  locationAccuracyM?: number;
  addressApprox?: string;
  observedAt?: string;
  reportedAt?: string;
  notes?: string;
  status: string;
  userId?: string;
  createdBy?: string;
  updatedAt?: string;
}

export default function SightingEditClient({ sightingId }: { sightingId: string }) {
  const router = useRouter();

  const [sighting, setSighting] = useState<Sighting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [speciesId, setSpeciesId] = useState("");
  const [notes, setNotes] = useState("");
  const [addressApprox, setAddressApprox] = useState("");

  // Fetch sighting data on mount
  useEffect(() => {
    async function fetchSighting() {
      try {
        const response = await fetch(`/api/sightings/${sightingId}`);
        if (response.ok) {
          const data = await response.json();
          setSighting(data);
          setSpeciesId(data.speciesId || "");
          setNotes(data.notes || "");
          setAddressApprox(data.addressApprox || "");
        } else {
          const err = await response.json();
          setError(err.error || "Failed to fetch sighting");
        }
      } catch (error) {
        console.error("Error fetching sighting:", error);
        setError("Failed to fetch sighting");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSighting();
  }, [sightingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const updateData = {
        speciesId: speciesId || null,
        notes: notes || "",
        addressApprox: addressApprox || null,
      };

      const response = await fetch(`/api/sightings/${sightingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to update sighting");
      }

      alert("Sighting updated successfully");
      router.push('/sightings');
    } catch (error) {
      console.error("Error updating sighting:", error);
      setError("Unable to update sighting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <p className="text-slate-600">Loading sighting data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/sightings')}
            className="inline-block px-6 py-3 bg-[#136207] text-white font-semibold rounded-lg hover:bg-[#0f5006] transition-colors"
          >
            Back to Sightings
          </button>
        </div>
      </div>
    );
  }

  if (!sighting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Sighting Not Found</h1>
          <p className="text-slate-600 mb-6">
            The sighting you're looking for doesn't exist or you don't have permission to edit it.
          </p>
          <button
            onClick={() => router.push('/sightings')}
            className="inline-block px-6 py-3 bg-[#136207] text-white font-semibold rounded-lg hover:bg-[#0f5006] transition-colors"
          >
            Back to Sightings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-primary-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Edit Sighting 🌱
          </h1>
          <p className="text-xl text-gray-600">
            Update your plant sighting information
          </p>
        </div>

        {/* Location Info (Read-only) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            Location (Cannot be changed)
          </label>

          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-700">
              <strong>Coordinates:</strong> {sighting.lat.toFixed(6)}, {sighting.lng.toFixed(6)}
              {sighting.locationAccuracyM && <span> (±{sighting.locationAccuracyM.toFixed(0)}m)</span>}
            </p>
            {sighting.addressApprox && (
              <p className="text-sm text-slate-700 mt-2">
                <strong>Address:</strong> {sighting.addressApprox}
              </p>
            )}
            <p className="text-sm text-slate-500 mt-2">
              <strong>Status:</strong> {sighting.status}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Editable Details */}
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

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/sightings')}
              className="flex-1 py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center text-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 px-6 bg-[#136207] hover:bg-[#0f5006] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center text-lg"
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
                  Updating...
                </>
              ) : (
                <>💾 Update Sighting</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
