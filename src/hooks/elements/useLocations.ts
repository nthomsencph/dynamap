import { useCallback, useEffect, useState, useMemo } from "react";
import type { Location } from "@/types/locations";

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all locations
  const fetchLocations = useCallback(async () => {
    setLoading(true); // Set loading when we start fetching
    try {
      const res = await fetch("/api/locations");
      if (!res.ok) throw new Error("Failed to fetch locations");
      const data = await res.json();
      // Combine state updates to reduce re-renders
      setLocations(data);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  }, []);

  // Add a new location
  const addLocation = useCallback(async (location: Location) => {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location),
    });
    if (!res.ok) throw new Error("Failed to add location");
    const newLocation = await res.json();
    setLocations((prev) => [...prev, newLocation]);
    return newLocation;
  }, []);

  // Update a location
  const updateLocation = useCallback(async (location: Location) => {
    const res = await fetch("/api/locations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location),
    });
    if (!res.ok) throw new Error("Failed to update location");
    const updated = await res.json();
    setLocations(prev => {
      // Ensure we don't have duplicate IDs
      const filtered = prev.filter(loc => loc.id !== updated.id);
      return [...filtered, updated];
    });
    return updated;
  }, []);

  // Delete a location
  const deleteLocation = useCallback(async (id: string) => {
    const res = await fetch("/api/locations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Failed to delete location");
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  }, []);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  const result = useMemo(() => ({
    locations,
    loading,
    error,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
  }), [locations, loading, error]); // Remove callback functions from dependencies

  return result;
} 