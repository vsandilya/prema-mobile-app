/**
 * Format distance in a user-friendly way
 * @param distanceKm - Distance in kilometers
 * @returns Formatted distance string or null if distance is not available
 */
export const formatDistance = (distanceKm?: number): string | null => {
  if (!distanceKm) return null;
  
  const distanceMiles = distanceKm * 0.621371;
  
  if (distanceMiles < 1) {
    return "Less than a mile away";
  }
  
  return `${Math.round(distanceMiles)} miles away`;
};

