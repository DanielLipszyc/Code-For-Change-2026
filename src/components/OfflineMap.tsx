"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";

interface OfflineMapProps {
  onMapClick: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function OfflineMap({ onMapClick, initialLat, initialLng }: OfflineMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Small delay to ensure container is rendered with dimensions
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      try {
        const initialPosition = initialLat && initialLng 
          ? [initialLat, initialLng] as [number, number]
          : [29.6516, -82.3248] as [number, number];

        const map = L.map(mapContainerRef.current, {
          center: initialPosition,
          zoom: 13,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Create custom icon for the marker
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #16a34a; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });

        // Add initial marker
        const marker = L.marker(initialPosition, {
          icon: customIcon,
          draggable: true,
        }).addTo(map);

        markerRef.current = marker;

        // Handle marker drag end
        marker.on('dragend', (e) => {
          const position = marker.getLatLng();
          onMapClick(position.lat, position.lng);
        });

        // Handle map click to move marker
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onMapClick(lat, lng);
        });

        mapRef.current = map;
        setIsLoaded(true);

        // Force map to invalidate size after mount
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onMapClick, initialLat, initialLng]);

  // Update marker position when initialLat/initialLng changes
  useEffect(() => {
    if (mapRef.current && markerRef.current && initialLat && initialLng) {
      markerRef.current.setLatLng([initialLat, initialLng]);
      mapRef.current.setView([initialLat, initialLng], 13);
    }
  }, [initialLat, initialLng]);

  return (
    <div 
      ref={mapContainerRef} 
      className="h-full w-full"
      style={{ minHeight: '384px', zIndex: 1 }}
    />
  );
}
