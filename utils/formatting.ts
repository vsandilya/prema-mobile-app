/**
 * Get display name for a user, falling back to "Prema User" if name is empty
 * Used for Guideline 5.1.1 compliance (optional name during signup)
 */
export const getDisplayName = (name?: string | null): string => {
  if (name && name.trim()) return name.trim();
  return 'Prema User';
};

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
  
  // Round to 1 decimal place
  const roundedMiles = Math.round(distanceMiles * 10) / 10;
  
  return `${roundedMiles} miles away`;
};

