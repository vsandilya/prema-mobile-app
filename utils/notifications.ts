/**
 * Push notification utility for handling Expo push notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';
import axios from 'axios';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type?: 'match' | 'message' | 'like';
  screen?: string;
  [key: string]: any;
}

/**
 * Request notification permissions from the user
 * @returns true if permissions granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the Expo push notification token for this device
 * @returns Push token string or null if unavailable
 */
export async function getPushToken(): Promise<string | null> {
  try {
    // Request permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '950daeae-2962-4bf0-9c65-90eb6b1bac9e', // Expo project ID from app.json
    });

    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Send push token to backend to register for notifications
 * @param token Push token to register
 * @param authToken User's authentication token
 * @returns true if successful, false otherwise
 */
export async function registerPushToken(
  token: string,
  authToken: string
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('push_token', token);

    const response = await axios.post(
      `${API_BASE_URL}/users/push-token`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.status === 200) {
      console.log('Push token registered successfully');
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Error registering push token:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Setup notification listeners and return cleanup function
 * @param onNotificationReceived Callback when notification is received
 * @param onNotificationTapped Callback when notification is tapped
 * @returns Cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener for notifications received while app is foregrounded
  const receivedListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification tapped:', response);
      onNotificationTapped?.(response);
    }
  );

  // Return cleanup function
  return () => {
    try {
      // New API uses subscription.remove()
      // Fallback guarded for safety in case of version differences
      (receivedListener as any)?.remove?.();
      (responseListener as any)?.remove?.();
    } catch (e) {
      console.warn('Notification cleanup error:', e);
    }
  };
}

/**
 * Get notification data from notification object
 * @param notification Notification object
 * @returns Parsed notification data
 */
export function getNotificationData(
  notification: Notifications.Notification | Notifications.NotificationResponse
): NotificationData | null {
  const data = notification.request.content.data;
  if (!data || typeof data !== 'object') {
    return {};
  }
  return data as NotificationData;
}

/**
 * Initialize push notifications for the app
 * This should be called after user logs in
 * @param authToken User's authentication token
 * @returns Push token if successful, null otherwise
 */
export async function initializePushNotifications(
  authToken: string
): Promise<string | null> {
  try {
    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return null;
    }

    // Get push token
    const token = await getPushToken();
    if (!token) {
      console.warn('Failed to get push token');
      return null;
    }

    // Register token with backend
    const registered = await registerPushToken(token, authToken);
    if (!registered) {
      console.warn('Failed to register push token with backend');
      return null;
    }

    console.log('Push notifications initialized successfully');
    return token;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return null;
  }
}

