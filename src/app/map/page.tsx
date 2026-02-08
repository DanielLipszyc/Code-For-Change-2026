'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

interface Submission {
  _id?: string;
  plantName: string;
  scientificName?: string;
  lat: number;
  lng: number;
  timestamp: number;
  notes?: string;
  imageData?: string;
}

let alachuaJson = require('./alachua.json');
var mapStyle = {
  "color": "#000000",
  "fillOpacity": 0
}

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Expose detail opener to window for popup button clicks
  useEffect(() => {
    (window as any).showSubmissionDetails = (submissionId: string) => {
      const submission = submissions.find(s => s._id === submissionId);
      if (submission) {
        setSelectedSubmission(submission);
      }
    };
    return () => {
      delete (window as any).showSubmissionDetails;
    };
  }, [submissions]);

  useEffect(() => {
    // Fetch submissions from MongoDB API
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/submissions');
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setDataLoaded(true);
      }
    };
    fetchSubmissions();
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Wait for data to be loaded before initializing map
    if (!dataLoaded) return;

    // Prevent multiple initializations
    if (map.current) return;

    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet only on client side
        const L = await import('leaflet');

        if (!mapContainer.current) return;

        // Fix leaflet default icon issue
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Create custom green icon for plant submissions
        const plantIcon = L.default.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        var lat, lon;
        [lat, lon] = await getLocation() as [number, number];
        console.log(lat, lon);
        const startLocation: [number, number] = [lat, lon];
        // Alachua County, Florida coordinates (approximate center)
        const alachuaCountyCenter: [number, number] = [29.6520, -82.3250];

        // Initialize map
        map.current = L.default.map(mapContainer.current as HTMLElement).setView(startLocation, 10);

        // Add OpenStreetMap tiles
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map.current);

        L.geoJSON(alachuaJson, {style: mapStyle}).addTo(map.current);

        // Add markers for all submitted plants from MongoDB
        submissions.forEach((submission) => {
          const popupContent = `
            <div style="min-width: 150px;">
              <b style="font-size: 14px; color: #136207;">🌿 ${submission.plantName}</b>
              ${submission.scientificName ? `<br><i style="color: #666; font-size: 12px;">${submission.scientificName}</i>` : ''}
              ${submission.notes ? `<br><span style="font-size: 12px;">${submission.notes}</span>` : ''}
              <br><span style="font-size: 11px; color: #888;">Spotted: ${new Date(submission.timestamp).toLocaleDateString()}</span>
              <button onclick="window.showSubmissionDetails('${submission._id}')" style="margin-top: 10px; padding: 8px 12px; background: #136207; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; width: 100%; font-weight: 600;">More details</button>
            </div>
          `;
          
          L.default.marker([submission.lat, submission.lng], {
            icon: plantIcon,
            title: submission.plantName,
          })
            .addTo(map.current)
            .bindPopup(popupContent);
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [dataLoaded, submissions]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            County Invasive Plant Map
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Invasive plant sightings across Alachua County, Florida
          </p>
        </div>

        {/* Map Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div
            ref={mapContainer}
            className="w-full h-[500px] sm:h-[600px] relative"
          >
            {isLoading && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              About Alachua County
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Alachua County is located in north-central Florida and is home to diverse wetland ecosystems and plant species. The county encompasses approximately 1,400 square miles and includes the city of Gainesville.
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Area: ~1,400 square miles</li>
              <li>• County Seat: Gainesville</li>
              <li>• Population: ~280,000</li>
              <li>• Key Wetlands: Paynes Prairie, Newnans Lake</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Native Plants
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Alachua County is rich in native plant species adapted to its subtropical climate and wetland environments.
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Sawgrass</li>
              <li>• Bald Cypress</li>
              <li>• Water Lilies</li>
              <li>• Pickerelweed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl font-bold"
              aria-label="Close details"
            >
              ✕
            </button>

            <div className="grid md:grid-cols-2">
              <div className="bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                {selectedSubmission.imageData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedSubmission.imageData}
                    alt={selectedSubmission.plantName}
                    className="w-full h-full object-cover max-h-[420px]"
                  />
                ) : (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    No photo provided
                  </div>
                )}
              </div>

              <div className="p-8 space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-green-700 font-semibold">Plant</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSubmission.plantName}</h3>
                  {selectedSubmission.scientificName && (
                    <p className="text-gray-600 dark:text-gray-300 italic">{selectedSubmission.scientificName}</p>
                  )}
                </div>

                <div className="space-y-2 text-gray-700 dark:text-gray-200">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">Spotted:</span>
                    <span>{new Date(selectedSubmission.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">Location:</span>
                    <span>
                      {selectedSubmission.lat.toFixed(4)}, {selectedSubmission.lng.toFixed(4)}
                    </span>
                  </div>
                  {selectedSubmission.notes && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold">Notes:</span>
                      <span className="text-gray-700 dark:text-gray-200">{selectedSubmission.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getLocation(): Promise<[number, number]> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          resolve([29.6520, -82.3250]);
        }
      );
    } else {
      resolve([29.6520, -82.3250]);
    }
  });
}


