'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

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

        // Alachua County, Florida coordinates (approximate center)
        const alachuaCountyCenter: [number, number] = [29.6520, -82.3250];

        // Initialize map
        map.current = L.default.map(mapContainer.current as HTMLElement).setView(alachuaCountyCenter, 10);

        // Add OpenStreetMap tiles
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map.current);

        // Add marker for Gainesville (main city in Alachua County)
        L.default.marker([29.6436, -82.1585], {
          title: 'Gainesville',
        })
          .addTo(map.current)
          .bindPopup('<b>Gainesville</b><br>Center of Alachua County')
          .openPopup();

        // Add a circle to roughly show Alachua County boundaries
        L.default.circle(alachuaCountyCenter, {
          color: '#3b82f6',
          fillColor: '#93c5fd',
          fillOpacity: 0.1,
          weight: 2,
          radius: 25000, // approximately 25km radius
        })
          .addTo(map.current)
          .bindPopup('<b>Alachua County</b><br>Area: ~1,400 sq mi');

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
  }, []);

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
    </div>
  );
}
