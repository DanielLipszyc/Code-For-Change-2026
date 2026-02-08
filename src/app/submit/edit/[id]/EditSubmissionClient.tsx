"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { plants } from "@/data/plants";

interface Submission {
  _id: string;
  plantName: string;
  scientificName?: string;
  lat: number;
  lng: number;
  timestamp: number;
  notes?: string;
  imageData?: string;
}

interface EditSubmissionClientProps {
  submission: Submission;
}

export default function EditSubmissionClient({ submission }: EditSubmissionClientProps) {
  const router = useRouter();
  const [plantName, setPlantName] = useState(submission.plantName);
  const [notes, setNotes] = useState(submission.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Find scientific name for selected plant
      const selectedPlant = plants.find(p => p.name === plantName);
      const scientificName = selectedPlant?.scientificName || submission.scientificName;

      const response = await fetch(`/api/submissions/${submission._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantName,
          scientificName,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update submission');
      }

      // Redirect to map on success
      router.push('/map');
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Failed to update submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-primary-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Submission
            </h2>
            <p className="text-gray-600">
              Update the details of your plant sighting
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plant Name Selection */}
            <div>
              <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-2">
                Plant Name
              </label>
              <select
                id="plantName"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select a plant...</option>
                {plants.map((plant) => (
                  <option key={plant.name} value={plant.name}>
                    {plant.name}
                    {plant.scientificName && ` (${plant.scientificName})`}
                  </option>
                ))}
                <option value="Unknown">Unknown Plant</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Add any observations or additional details..."
              />
            </div>

            {/* Location Info (Read-only) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Location (Cannot be changed)</h3>
              <p className="text-sm text-gray-600">
                Coordinates: {submission.lat.toFixed(4)}, {submission.lng.toFixed(4)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Spotted: {new Date(submission.timestamp).toLocaleString()}
              </p>
            </div>

            {/* Image Info (Read-only) */}
            {submission.imageData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Photo</h3>
                <p className="text-sm text-gray-600 mb-2">Current photo (cannot be changed):</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.imageData}
                  alt={submission.plantName}
                  className="w-full max-w-sm rounded-lg"
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/map')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-[#136207] text-white rounded-lg font-medium hover:bg-[#0d4705] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
