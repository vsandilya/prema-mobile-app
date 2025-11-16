import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import FullScreenPhotoScreen from './screens/FullScreenPhotoScreen';
import ConversationsScreen from './screens/ConversationsScreen';
import ChatScreen from './screens/ChatScreen';
import BrowseScreen from './screens/BrowseScreen';
import MatchesScreen from './screens/MatchesScreen';
import LikesScreen from './screens/LikesScreen';
import { setupNotificationListeners, getNotificationData } from './utils/notifications';
import { navigationRef } from './utils/navigation';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Browse" 
        component={BrowseScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Edit Profile',
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
          headerTintColor: '#1a1a1a',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="FullScreenPhoto" 
        component={FullScreenPhotoScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Conversations" 
        component={ConversationsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Likes" 
        component={LikesScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      // Notification received (foreground)
      (notification) => {
        console.log('Notification received:', notification);
        // You can show an in-app notification here if needed
      },
      // Notification tapped
      (response) => {
        console.log('Notification tapped:', response);
        const data = getNotificationData(response);
        
        if (!navigationRef.current) return;

        // Navigate based on notification type
        if (data?.type === 'match' || data?.screen === 'Matches') {
          navigationRef.current.navigate('Matches');
        } else if (data?.type === 'message' || data?.screen === 'Conversations') {
          navigationRef.current.navigate('Conversations');
          // If we have a user_id in the data, we could navigate to specific chat
          if (data.user_id) {
            // Navigate to specific chat after a short delay
            setTimeout(() => {
              navigationRef.current?.navigate('Chat', {
                userId: data.user_id,
                userName: data.user_name || 'User'
              });
            }, 500);
          }
        } else if (data?.type === 'like' || data?.screen === 'Browse') {
          navigationRef.current.navigate('Browse');
        }
      }
    );

    return cleanup;
  }, [user, token]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
