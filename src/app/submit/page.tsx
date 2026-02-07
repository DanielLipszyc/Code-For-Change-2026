"use client";

import { useState, useRef } from "react";
import { plants } from "@/data/plants";

interface AIPrediction {
  prediction: string;
  isKnownPlant: boolean;
  confidence: string;
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
  const [location, setLocation] = useState("");
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

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
  };

  const resetForm = () => {
    setSelectedImage(null);
    setFileName("");
    setPlantName("");
    setLocation("");
    setNotes("");
    setSubmitted(false);
    setAiPrediction(null);
    setShowComparison(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-green-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-12">
            <div className="text-6xl mb-6">🌿</div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Plant Submitted!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Thank you for your contribution to documenting wetland plants.
              Your submission is being reviewed.
            </p>
            <button
              onClick={resetForm}
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Submit Another Plant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-green-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Submit a Plant 🌱
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Upload a photo of a plant you spotted in a swamp or wetland
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Plant Photo *
            </label>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                selectedImage
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10"
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG, HEIC up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Identification Status */}
          {selectedImage && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                🤖 AI Plant Identification
              </h3>
              
              {isIdentifying ? (
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <svg className="animate-spin h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analyzing image...</span>
                </div>
              ) : aiPrediction ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg ${
                    aiPrediction.isKnownPlant 
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                      : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  }`}>
                    <p className="font-medium text-gray-900 dark:text-white">
                      AI Prediction: <span className={aiPrediction.isKnownPlant ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}>{aiPrediction.prediction}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {aiPrediction.isKnownPlant 
                        ? "✓ Matches known invasive species" 
                        : "⚠ Not in our invasive species database"}
                    </p>
                  </div>

                  {showComparison && plantName && (
                    <div className={`p-4 rounded-lg ${
                      plantName.toLowerCase() === aiPrediction.prediction.toLowerCase()
                        ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"
                        : "bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700"
                    }`}>
                      {plantName.toLowerCase() === aiPrediction.prediction.toLowerCase() ? (
                        <p className="text-green-700 dark:text-green-300 font-medium">
                          ✅ Your selection matches the AI prediction!
                        </p>
                      ) : (
                        <p className="text-orange-700 dark:text-orange-300 font-medium">
                          ⚠️ Your selection ({plantName}) differs from AI prediction ({aiPrediction.prediction})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Unable to identify plant. Please select manually below.
                </p>
              )}
            </div>
          )}

          {/* Plant Details */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
            <div>
              <label
                htmlFor="plantName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
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
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  💡 AI suggests: {aiPrediction.prediction}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Location *
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="e.g., Everglades National Park, FL"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Additional Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                placeholder="Describe the habitat, water conditions, nearby plants..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedImage || !plantName || isSubmitting}
            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-colors flex items-center justify-center text-lg"
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
