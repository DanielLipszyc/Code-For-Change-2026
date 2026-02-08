'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import 'leaflet/dist/leaflet.css';
import { UserRole } from '@/types/auth';

interface Submission {
  _id?: string;
  plantName: string;
  scientificName?: string;
  lat: number;
  lng: number;
  timestamp: number;
  notes?: string;
  imageData?: string;
  userId?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'pending' | 'approved';
}

let alachuaJson = require('./alachua.json');
var mapStyle = {
  "color": "#000000",
  "fillOpacity": 0
}

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  const needsQuotes = /[",\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const safeRows = rows ?? [];
  if (safeRows.length === 0) return;

  // stable columns = union of keys
  const columns = Array.from(
    safeRows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const header = columns.map(escapeCsvValue).join(",");
  const lines = safeRows.map((row) =>
    columns.map((col) => escapeCsvValue(row[col])).join(",")
  );

  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { user } = useUser();
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Get unique plant names for filter
  const uniquePlants = Array.from(
    submissions.reduce((set, s) => {
      if (s.plantName) set.add(s.plantName);
      return set;
    }, new Set<string>())
  ).sort();

  // Filter submissions based on selected filters
  const filteredSubmissions = submissions.filter((s) => {
    // Check plant filter
    if (selectedPlants.length > 0 && !selectedPlants.includes(s.plantName)) {
      return false;
    }
    // Check date range filter - compare date strings to avoid timezone issues
    if (dateFrom || dateTo) {
      const submissionDateStr = new Date(s.timestamp).toISOString().split('T')[0];
      if (dateFrom && submissionDateStr < dateFrom) {
        return false;
      }
      if (dateTo && submissionDateStr > dateTo) {
        return false;
      }
    }
    return true;
  });

  const handleClearFilters = () => {
    setSelectedPlants([]);
    setDateFrom('');
    setDateTo('');
  };

  const handleSelectAllPlants = () => {
    setSelectedPlants(uniquePlants);
  };

  const handleClearAllPlants = () => {
    setSelectedPlants([]);
  };

  const handlePlantToggle = (plantName: string) => {
    setSelectedPlants((prev) =>
      prev.includes(plantName)
        ? prev.filter((p) => p !== plantName)
        : [...prev, plantName]
    );
  };

  const handleExportCsv = useCallback(() => {
    // Non-admins: export approved only
    const exportable =
      userRole === "admin"
        ? submissions
        : submissions.filter((s) => s.status !== "pending");

    const rows = exportable.map((s) => ({
      id: s._id ?? "",
      plantName: s.plantName ?? "",
      scientificName: s.scientificName ?? "",
      status: s.status ?? "",
      latitude: s.lat ?? "",
      longitude: s.lng ?? "",
      spottedAtISO: s.timestamp ? new Date(s.timestamp).toISOString() : "",
      spottedAtLocal: s.timestamp ? new Date(s.timestamp).toLocaleString() : "",
      notes: s.notes ?? "",
      createdBy: s.createdBy ?? "",
      userId: s.userId ?? "",
      createdAtISO: s.createdAt ? new Date(s.createdAt).toISOString() : "",
      updatedAtISO: s.updatedAt ? new Date(s.updatedAt).toISOString() : "",
      // Optional: include image presence rather than full base64 (keeps CSV light)
      hasImage: s.imageData ? "yes" : "no",
    }));

    const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    downloadCsv(`swamp-spotter-map-export-${stamp}.csv`, rows);
  }, [submissions, userRole]);

  
  // Fetch user role when user is authenticated
  useEffect(() => {
    if (user) {
      fetch('/api/users/me')
        .then(res => res.json())
        .then(data => {
          setUserRole(data.role);
          setRoleLoaded(true);
        })
        .catch(err => {
          console.error('Error fetching user role:', err);
          setRoleLoaded(true); // Still mark as loaded even on error
        });
    } else {
      // No user, so role is effectively loaded (as guest)
      setRoleLoaded(true);
    }
  }, [user]);

  // Expose handlers to window for popup button clicks
  useEffect(() => {
    (window as any).showSubmissionDetails = (submissionId: string) => {
      const submission = submissions.find(s => s._id === submissionId);
      if (submission) {
        setSelectedSubmission(submission);
      }
    };
    (window as any).handleDeleteSubmission = handleDelete;
    (window as any).handleEditSubmission = handleEdit;
    (window as any).handleApproveSubmission = handleApprove;
    return () => {
      delete (window as any).showSubmissionDetails;
      delete (window as any).handleDeleteSubmission;
      delete (window as any).handleEditSubmission;
      delete (window as any).handleApproveSubmission;
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

  // Handle delete submission
  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from state
        setSubmissions(prev => prev.filter(s => s._id !== submissionId));
        setSelectedSubmission(null);
        alert('Submission deleted successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete submission');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission');
    }
  };

  // Handle edit submission (navigate to edit page)
  const handleEdit = (submissionId: string) => {
    window.location.href = `/submit/edit/${submissionId}`;
  };

  // Handle approve submission (admin only)
  const handleApprove = useCallback(async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        // Update submission status in state
        setSubmissions(prev => prev.map(s =>
          s._id === submissionId ? { ...s, status: 'approved' as const } : s
        ));
        // Update selected submission if it's the one being approved
        if (selectedSubmission?._id === submissionId) {
          setSelectedSubmission({ ...selectedSubmission, status: 'approved' as const });
        }
        alert('Submission approved successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve submission');
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Failed to approve submission');
    }
  }, [selectedSubmission]);

  // Check if user can edit submission
  const canEdit = (submission: Submission): boolean => {
    if (!user || !submission.userId) return false;
    return submission.userId === user.id;
  };

  // Check if user can delete submission
  const canDelete = (submission: Submission): boolean => {
    if (!user) return false;
    // Admins can delete any submission
    if (userRole === 'admin') return true;
    // Users can delete their own submissions
    if (!submission.userId) return false;
    return submission.userId === user.id;
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Wait for data to be loaded before initializing map
    if (!dataLoaded) return;

    // Wait for user role to be loaded before initializing map
    if (!roleLoaded) return;

    // Clean up existing map if it exists (to allow re-render when userRole changes)
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

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

        // Create custom green icon for approved plant submissions
        const approvedPlantIcon = L.default.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        // Create custom red icon for pending plant submissions (admin only)
        const pendingPlantIcon = L.default.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
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

        // Add markers for filtered submitted plants from MongoDB
        filteredSubmissions.forEach((submission) => {
          // Determine icon color based on status and user role
          // Admins see: pending (red) vs approved (green)
          // Regular users see: all markers as green
          const isPending = submission.status === 'pending';
          const markerIcon = (isPending && userRole === 'admin') ? pendingPlantIcon : approvedPlantIcon;

          const popupContent = `
            <div style="min-width: 150px;">
              <b style="font-size: 14px; color: #136207;">🌿 ${submission.plantName}</b>
              ${submission.scientificName ? `<br><i style="color: #666; font-size: 12px;">${submission.scientificName}</i>` : ''}
              ${submission.notes ? `<br><span style="font-size: 12px;">${submission.notes}</span>` : ''}
              <br><span style="font-size: 11px; color: #888;">Spotted: ${new Date(submission.timestamp).toLocaleDateString()}</span>
              ${(isPending && userRole === 'admin') ? `<br><span style="font-size: 11px; color: #dc2626; font-weight: 600;">⏳ Pending Approval</span>` : ''}
              <button onclick="window.showSubmissionDetails('${submission._id}')" style="margin-top: 10px; padding: 8px 12px; background: #136207; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; width: 100%; font-weight: 600;">More details</button>
            </div>
          `;

          L.default.marker([submission.lat, submission.lng], {
            icon: markerIcon,
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
  }, [dataLoaded, submissions, userRole, roleLoaded, filteredSubmissions, selectedPlants, dateFrom, dateTo]);

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
          {/* Card header */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Sightings map
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Export includes {userRole === "admin" ? "all submissions" : "approved submissions only"}.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!dataLoaded || submissions.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download sightings as CSV"
            >
              ⬇️ Export CSV
            </button>
          </div>

          {/* Filter Section */}
          <div className="px-3 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {/* Plant Species Filter */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-900 dark:text-white">
                  🌿 Filter by Plant Species
                </label>
                {uniquePlants.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllPlants}
                      className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearAllPlants}
                      className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              {uniquePlants.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {uniquePlants.map((plant) => (
                    <label key={plant} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPlants.includes(plant)}
                        onChange={() => handlePlantToggle(plant)}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{plant}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No plants to filter</p>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">
                📅 Filter by Date Range
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full box-border rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full box-border rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button and Results Count */}
            <div className="flex items-center justify-between">
              {(selectedPlants.length > 0 || dateFrom || dateTo) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-sm font-medium transition-colors"
                >
                  ✕ Clear All Filters
                </button>
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Showing {filteredSubmissions.length} of {submissions.length} sightings
              </span>
            </div>
          </div>

          {/* Map */}
          <div ref={mapContainer} className="w-full h-[500px] sm:h-[600px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>
        </div>


        {/* Admin Pending Submissions Section */}
        {userRole === 'admin' && submissions.filter(s => s.status === 'pending').length > 0 && (
          <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⏳</span>
              <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                Pending Submissions ({submissions.filter(s => s.status === 'pending').length})
              </h2>
            </div>
            <p className="text-amber-800 dark:text-amber-200 mb-4">
              Click on any submission below to view details and approve
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions
                .filter(s => s.status === 'pending')
                .map((submission) => (
                  <button
                    key={submission._id}
                    onClick={() => setSelectedSubmission(submission)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left border-2 border-amber-200 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-500"
                  >
                    <div className="flex items-start gap-3">
                      {submission.imageData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={submission.imageData}
                          alt={submission.plantName}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🌿</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {submission.plantName}
                        </h3>
                        {submission.scientificName && (
                          <p className="text-xs italic text-gray-600 dark:text-gray-400 truncate">
                            {submission.scientificName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(submission.timestamp).toLocaleDateString()}
                        </p>
                        {submission.createdBy && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            By: {submission.createdBy}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

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
                  {selectedSubmission.createdBy && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold">Submitted by:</span>
                      <span className="text-gray-700 dark:text-gray-200">{selectedSubmission.createdBy}</span>
                    </div>
                  )}
                </div>

                {/* Edit/Delete/Approve Buttons */}
                {user && (canEdit(selectedSubmission) || canDelete(selectedSubmission) || (userRole === 'admin' && selectedSubmission.status === 'pending')) && (
                  <div className="pt-4 flex gap-3">
                    {canEdit(selectedSubmission) && (
                      <button
                        onClick={() => handleEdit(selectedSubmission._id!)}
                        className="flex-1 px-4 py-2 bg-[#136207] text-white rounded-md hover:bg-[#0d4705] transition-colors font-medium"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete(selectedSubmission) && (
                      <button
                        onClick={() => handleDelete(selectedSubmission._id!)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    )}
                    {userRole === 'admin' && selectedSubmission.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(selectedSubmission._id!)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                )}
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


