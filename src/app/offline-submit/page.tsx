"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { offlineStorage } from "@/lib/offlineStorage";
import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(
  () => import("@/components/OfflineMap"),
  { ssr: false }
);

export default function OfflineSubmitPage() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationAccuracyM, setLocationAccuracyM] = useState<number | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        setLocationAccuracyM(position.coords.accuracy);
        setIsGettingLocation(false);
        setLocationError("");
      },
      (error) => {
        let errorMessage = "Unable to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = `Unable to get location: ${error.message || "Unknown error"}`;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleMapClick = (clickedLat: number, clickedLng: number) => {
    setLat(clickedLat);
    setLng(clickedLng);
    setLocationError("");
  };

  const handleSaveDraft = async () => {
    if (!selectedImage) {
      alert("Please upload a photo");
      return;
    }

    if (lat === null || lng === null) {
      alert("Please select a location on the map or use GPS");
      return;
    }

    setIsSaving(true);

    try {
      await offlineStorage.saveDraft({
        lat,
        lng,
        locationAccuracyM,
        imageData: selectedImage,
        timestamp: Date.now(),
        userId: user?.id,
      });

      alert("Draft saved! Go to Drafts page to complete it later.");
      router.push("/drafts");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-primary-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Offline Mode
          </h1>
          <p className="text-xl text-gray-600">
            Save location and photo when you&apos;re out in the field
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Location Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>

            <div className="mb-4 flex gap-3">
              <button
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGettingLocation ? "Getting Location..." : "Use My GPS"}
              </button>
              <p className="text-sm text-gray-600 self-center">
                Or click on the map to place a pin
              </p>
            </div>

            {locationError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md px-4 py-2 text-sm text-red-700">
                {locationError}
              </div>
            )}

            {lat !== null && lng !== null && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-md px-4 py-2 text-sm text-green-700">
                Location selected: {lat.toFixed(6)}, {lng.toFixed(6)}
              </div>
            )}

            <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 relative">
              <MapWithNoSSR 
                onMapClick={handleMapClick} 
                initialLat={lat || undefined}
                initialLng={lng || undefined}
              />
            </div>
          </div>

          {/* Photo Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Photo</h2>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              {selectedImage ? (
                <div>
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="max-h-64 mx-auto rounded-lg mb-4"
                  />
                  <p className="text-sm text-gray-600">{fileName}</p>
                </div>
              ) : (
                <div>
                  <div className="text-5xl mb-4">📷</div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, or GIF (max 2MB)
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="w-full px-6 py-4 rounded-xl text-base font-semibold bg-[#136207] text-white hover:bg-[#0d4705] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>

          <p className="mt-4 text-sm text-gray-600 text-center">
            You can complete this draft later on the Drafts page
          </p>
        </div>
      </div>
    </main>
  );
}
