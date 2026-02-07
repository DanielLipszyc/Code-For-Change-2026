"use client";

import { useState, useRef } from "react";
import { plants } from "@/data/plants";

interface AIPrediction {
  prediction: string;
  scientificName: string | null;
  isKnownPlant: boolean;
}

// Compress image to reduce payload size for Vercel (max ~500KB output)
const compressImage = (dataUrl: string, maxSize = 512, quality = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Scale down to fit within maxSize x maxSize
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with lower quality for smaller size
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
};

export default function Submit() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [plantName, setPlantName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const identifyPlant = async (imageData: string) => {
    setIsIdentifying(true);
    setAiPrediction(null);
    
    try {
      // Compress image before sending to API
      const compressedImage = await compressImage(imageData);
      
      const response = await fetch("/api/identify-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressedImage }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiPrediction(data);
      } else {
        console.error("Failed to identify plant");
      }
    } catch (error) {
      console.error("Error identifying plant:", error);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setSelectedImage(imageData);
        identifyPlant(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setSelectedImage(imageData);
        identifyPlant(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      // Create submission with location and image
      // Compress image for storage (smaller size for MongoDB)
      let storedImage: string | undefined;
      if (selectedImage) {
        storedImage = await compressImage(selectedImage, 800, 0.7);
      }

      const submission = {
        plantName: aiPrediction?.prediction || plantName || 'Unknown Plant',
        scientificName: aiPrediction?.scientificName || undefined,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        notes: notes || undefined,
        imageData: storedImage,
      };

      // Save to MongoDB via API
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        throw new Error('Failed to save submission');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting plant:', error);
      alert('Unable to submit. Please check your location services and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setFileName("");
    setPlantName("");
    setNotes("");
    setSubmitted(false);
    setAiPrediction(null);
    setShowComparison(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-primary-50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12">
            <div className="text-6xl mb-6">🌿</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Plant Submitted!
            </h2>
            <p className="text-gray-600 mb-8">
              Thank you for your contribution to documenting wetland plants.
              Your submission is being reviewed.
            </p>
            <button
              onClick={resetForm}
              className="inline-flex items-center justify-center px-6 py-3 bg-[#136207] hover:bg-[#0f5006] text-white font-medium rounded-lg transition-colors"
            >
              Submit Another Plant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-primary-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Submit a Plant 🌱
          </h1>
          <p className="text-xl text-gray-600">
            Upload a photo of a plant you spotted in a swamp or wetland
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Area */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Plant Photo *
            </label>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                selectedImage
                  ? "border-[#136207] bg-primary-50"
                  : "border-gray-300 hover:border-[#136207] hover:bg-primary-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              
              {selectedImage ? (
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-600">
                    {fileName}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setFileName("");
                      setAiPrediction(null);
                      setShowComparison(false);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-5xl">📷</div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, HEIC up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Identification Status */}
          {selectedImage && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🤖 AI Plant Identification
              </h3>
              
              {isIdentifying ? (
                <div className="flex items-center space-x-3 text-gray-600">
                  <svg className="animate-spin h-5 w-5 text-[#136207]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analyzing image...</span>
                </div>
              ) : aiPrediction ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#136207]">AI Identification</span>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {aiPrediction.prediction}
                      {aiPrediction.scientificName && (
                        <span className="text-base font-normal text-gray-600 ml-2">
                          ({aiPrediction.scientificName})
                        </span>
                      )}
                    </p>
                  </div>

                  {showComparison && plantName && (
                    <div className={`p-4 rounded-lg ${
                      plantName.toLowerCase() === aiPrediction.prediction.toLowerCase()
                        ? "bg-primary-100 border border-primary-300"
                        : "bg-orange-100 border border-orange-300"
                    }`}>
                      {plantName.toLowerCase() === aiPrediction.prediction.toLowerCase() ? (
                        <p className="text-[#136207] font-medium">
                          ✅ Your selection matches the AI prediction!
                        </p>
                      ) : (
                        <p className="text-orange-700 font-medium">
                          ⚠️ Your selection ({plantName}) differs from AI prediction ({aiPrediction.prediction})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">
                  Unable to identify plant. Please select manually below.
                </p>
              )}
            </div>
          )}

          {/* Plant Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
            <div>
              <label
                htmlFor="plantName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Plant Species *
              </label>
              <select
                id="plantName"
                value={plantName}
                onChange={(e) => {
                  setPlantName(e.target.value);
                  if (aiPrediction && e.target.value) {
                    setShowComparison(true);
                  }
                }}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#136207] focus:border-transparent transition-colors"
              >
                <option value="">-- Select a plant --</option>
                {plants.map((plant) => (
                  <option key={plant.name} value={plant.name}>
                    {plant.name} ({plant.scientificName})
                  </option>
                ))}
                <option value="Unknown">Unknown / Other</option>
              </select>
              {aiPrediction?.isKnownPlant && !plantName && (
                <p className="text-sm text-[#136207] mt-2">
                  💡 AI suggests: {aiPrediction.prediction}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Additional Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#136207] focus:border-transparent transition-colors resize-none"
                placeholder="Describe the habitat, water conditions, nearby plants..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedImage || !plantName || isSubmitting}
            className="w-full py-4 px-6 bg-[#136207] hover:bg-[#0f5006] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center text-lg"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              <>🌿 Submit Plant</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
