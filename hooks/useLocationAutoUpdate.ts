import { useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';

const LOCATION_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const LAST_UPDATE_KEY = 'lastLocationUpdate';

interface UseLocationAutoUpdateReturn {
  initializeLocation: () => Promise<boolean>;
}

/**
 * Custom hook for auto-updating user location
 * - Checks permissions silently
 * - Throttles updates (max once per 10 minutes)
 * - Updates user profile with current GPS coordinates
 */
export const useLocationAutoUpdate = (): UseLocationAutoUpdateReturn => {
  const { updateUser, user } = useAuth();

  /**
   * Initialize location and update if needed
   * @returns true if location was updated, false otherwise
   */
  const initializeLocation = useCallback(async (): Promise<boolean> => {
    try {
      // Check if user is logged in
      if (!user) {
        console.log('No user logged in, skipping location update');
        return false;
      }

      // Check if we need to throttle the update
      const lastUpdate = await AsyncStorage.getItem(LAST_UPDATE_KEY);
      if (lastUpdate) {
        const lastUpdateTime = parseInt(lastUpdate, 10);
        const now = Date.now();
        const timeSinceUpdate = now - lastUpdateTime;
        
        if (timeSinceUpdate < LOCATION_UPDATE_INTERVAL) {
          console.log(`Location update throttled. Time since last update: ${Math.round(timeSinceUpdate / 1000)}s`);
          return false;
        }
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return false;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Update user profile with new location
      await updateUser({
        location_latitude: latitude,
        location_longitude: longitude,
      });

      // Store the timestamp of this update
      await AsyncStorage.setItem(LAST_UPDATE_KEY, Date.now().toString());

      console.log(`Location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  }, [user, updateUser]);

  return { initializeLocation };
};

