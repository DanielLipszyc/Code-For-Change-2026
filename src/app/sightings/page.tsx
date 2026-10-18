"use client";

import { useEffect, useState } from "react";

interface Sighting {
  _id: string;
  plantName: string;
  lat: number;
  lng: number;
  timestamp: number;
  notes?: string;
  imageData?: string;
  createdAt: string;
  status?: "pending" | "approved";
}

export default function SightingsPage() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    loadSightings();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Silently fail - location is optional
        }
      );
    }
  };

  const loadSightings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/submissions");
      if (!response.ok) {
        throw new Error("Failed to load sightings");
      }
      const data: Sighting[] = await response.json();
      // Only reviewed reports are shown here, even to their submitter or an admin
      setSightings((data || []).filter((s) => s.status === "approved"));
    } catch (err: any) {
      setError(err.message || "Unable to load sightings");
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-600">Loading sightings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadSightings}
            className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">What People Found</h1>
          <p className="text-lg text-gray-600 mb-4">
            See what plants people have spotted recently in your area
          </p>
          {userLocation && (
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>Showing nearby sightings</span>
            </div>
          )}
        </div>

        {sightings.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No sightings yet</h2>
            <p className="text-gray-600 mb-6">
              Be the first to spot and submit a plant!
            </p>
            <button
              onClick={() => window.location.href = "/submit"}
              className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Submit a Sighting
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sightings.map((sighting) => {
              const distance = userLocation
                ? calculateDistance(userLocation.lat, userLocation.lng, sighting.lat, sighting.lng)
                : null;

              return (
                <div
                  key={sighting._id}
                  className="border border-gray-200 rounded-lg p-4 flex gap-4 hover:border-green-300 transition-colors"
                >
                  {sighting.imageData && (
                    <div className="flex-shrink-0">
                      <img
                        src={sighting.imageData}
                        alt={sighting.plantName}
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {sighting.plantName}
                      </h3>
                      {distance !== null && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="font-medium">Location:</span>
                        <span>{sighting.lat.toFixed(6)}, {sighting.lng.toFixed(6)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Date:</span>
                        <span>{new Date(sighting.timestamp).toLocaleDateString()}</span>
                      </div>
                      {sighting.notes && (
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l-8.586-8.586z" />
                          </svg>
                          <span className="font-medium">Notes:</span>
                          <span className="line-clamp-2">{sighting.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
