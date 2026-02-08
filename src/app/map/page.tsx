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

        // Add markers for all submitted plants from MongoDB
        submissions.forEach((submission) => {
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
  }, [dataLoaded, submissions, userRole, roleLoaded]);

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


