"use client";

import { useEffect, useState } from "react";

type Sighting = {
  _id: { $oid?: string } | string;
  speciesId?: string | null;
  lat: number;
  lng: number;
  addressApprox?: string;
  observedAt?: string;
  reportedAt?: string;
  notes?: string;
  status: string;
  reporterId?: string | null;
};

export default function TestSightingsPage() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Simple form state
  const [speciesId, setSpeciesId] = useState("air_potato");
  const [lat, setLat] = useState(29.6516);
  const [lng, setLng] = useState(-82.3248);
  const [address, setAddress] = useState("Depot Park");
  const [notes, setNotes] = useState("Test submission from debug page");

  // Fetch sightings
  const fetchSightings = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sightings");
      const data = await res.json();
      setSightings(data);
    } catch (err) {
      setError("Failed to fetch sightings");
    } finally {
      setLoading(false);
    }
  };

  // Create a test sighting
  const createSighting = async () => {
    setError("");

    try {
      const res = await fetch("/api/sightings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          speciesId,
          lat: Number(lat),
          lng: Number(lng),
          addressApprox: address,
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create sighting");
        return;
      }

      await fetchSightings();
    } catch {
      setError("Request failed");
    }
  };

  useEffect(() => {
    fetchSightings();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>API Test: Sightings</h1>

      {/* Create form */}
      <h2>Create Test Sighting</h2>
      <div style={{ display: "grid", gap: 8, maxWidth: 400 }}>
        <input
          placeholder="speciesId"
          value={speciesId}
          onChange={(e) => setSpeciesId(e.target.value)}
        />
        <input
          type="number"
          step="0.0001"
          value={lat}
          onChange={(e) => setLat(Number(e.target.value))}
          placeholder="Latitude"
        />
        <input
          type="number"
          step="0.0001"
          value={lng}
          onChange={(e) => setLng(Number(e.target.value))}
          placeholder="Longitude"
        />
        <input
          placeholder="Address approx"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button onClick={createSighting}>
          Create Sighting
        </button>

        <button onClick={fetchSightings}>
          Refresh List
        </button>
      </div>

      {error && (
        <p style={{ color: "red", marginTop: 12 }}>{error}</p>
      )}

      <hr style={{ margin: "24px 0" }} />

      {/* Results */}
      <h2>Results ({sightings.length})</h2>

      {loading && <p>Loading...</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {sightings.map((s) => {
          const id =
            typeof s._id === "string"
              ? s._id
              : (s._id as any)?.$oid || JSON.stringify(s._id);

          return (
            <div
              key={id}
              style={{
                border: "1px solid #ccc",
                padding: 12,
                borderRadius: 6
              }}
            >
              <strong>ID:</strong> {id} <br />
              <strong>Species:</strong> {s.speciesId || "Unknown"} <br />
              <strong>Location:</strong> {s.lat}, {s.lng} <br />
              <strong>Address:</strong> {s.addressApprox || "N/A"} <br />
              <strong>Status:</strong> {s.status} <br />
              <strong>Reported:</strong>{" "}
              {s.reportedAt
                ? new Date(s.reportedAt).toLocaleString()
                : "N/A"} <br />
              <strong>Notes:</strong> {s.notes || "None"}
            </div>
          );
        })}
      </div>

      <hr style={{ margin: "24px 0" }} />

      {/* Raw JSON (debug) */}
      <h2>Raw JSON</h2>
      <pre
        style={{
          background: "#f5f5f5",
          padding: 12,
          overflow: "auto",
          maxHeight: 400
        }}
      >
        {JSON.stringify(sightings, null, 2)}
      </pre>
    </div>
  );
}
