export interface AddressResult {
  road?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
  formattedAddress: string;
}

/**
 * Reverse geocodes latitude and longitude coordinates using the free Nominatim OpenStreetMap API.
 * 
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise resolving to an AddressResult containing extracted address components.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<AddressResult> {
  // Respect Nominatim's usage policy (max 1 request per second typically, requires User-Agent).
  // Next.js fetch usually passes default User-Agents, but it's good practice to provide one.
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        // Optional: 'User-Agent': 'CommunityHeroApp/1.0 (contact@example.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed with status: ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      road: address.road || address.pedestrian || address.street,
      suburb: address.suburb || address.neighbourhood || address.residential,
      city: address.city || address.town || address.village || address.county,
      postcode: address.postcode,
      formattedAddress: data.display_name || 'Unknown Location'
    };
  } catch (error) {
    console.error("Error in reverseGeocode:", error);
    throw error;
  }
}
