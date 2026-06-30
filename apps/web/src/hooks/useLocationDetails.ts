import { useState, useEffect } from 'react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { reverseGeocode, AddressResult } from '../lib/geocoding';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationDetails {
  address: AddressResult | null;
  ward: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to automatically fetch reverse geocoding data and determine the ward 
 * via local GeoJSON based on provided coordinates.
 */
export function useLocationDetails(coords: Coordinates | null): LocationDetails {
  const [address, setAddress] = useState<AddressResult | null>(null);
  const [ward, setWard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!coords) {
      setAddress(null);
      setWard(null);
      return;
    }

    let isMounted = true;

    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch Address via Nominatim
        const addressResult = await reverseGeocode(coords.lat, coords.lng);
        
        if (!isMounted) return;
        setAddress(addressResult);

        // 2. Fetch local ward boundaries GeoJSON
        const geojsonRes = await fetch('/ward-boundaries.geojson');
        if (!geojsonRes.ok) throw new Error('Failed to load ward boundaries');
        
        const geojson = await geojsonRes.json();
        
        // 3. Determine Ward using Turf.js
        // Turf uses [longitude, latitude]
        const pt = point([coords.lng, coords.lat]);
        let foundWard: string | null = null;

        for (const feature of geojson.features) {
          if (booleanPointInPolygon(pt, feature)) {
            foundWard = feature.properties?.ward_name || feature.properties?.name || 'Unknown Ward';
            break;
          }
        }

        if (!isMounted) return;
        setWard(foundWard);

      } catch (err: any) {
        console.error("Error fetching location details:", err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [coords?.lat, coords?.lng]);

  return { address, ward, isLoading, error };
}
