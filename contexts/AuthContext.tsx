import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { initializePushNotifications } from '../utils/notifications';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface User {
  id: number;
  email: string;
  name: string;
  age: number;
  bio?: string;
  gender: string;
  location_latitude?: number;
  location_longitude?: number;
  photos?: string[];
  preferences?: any;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  timestamp: string;
  sender_name: string;
  receiver_name: string;
}

interface ConversationSummary {
  user_id: number;
  user_name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface UserProfile {
  id: number;
  name: string;
  age: number;
  bio?: string;
  gender: string;
  location_latitude?: number;
  location_longitude?: number;
  photos?: string[];
  distance_km?: number;
}

interface BrowseResponse {
  users: UserProfile[];
  total: number;
  skip: number;
  limit: number;
}

interface InteractionResponse {
  id: number;
  user_id: number;
  target_user_id: number;
  interaction_type: string;
  timestamp: string;
  target_user_name: string;
  is_match?: boolean;
}

interface MatchResponse {
  id: number;
  name: string;
  age: number;
  bio?: string;
  photos?: string[];
  matched_at: string;
}

interface BrowseParams {
  skip?: number;
  limit?: number;
  min_age?: number;
  max_age?: number;
  gender?: string;
  max_distance?: number;
}

interface UnmatchResponse {
  message: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateUserPhotos: (photos: string[]) => void;
  refreshUser: () => Promise<void>;
  registerForPushNotifications: () => Promise<void>;
  // Messaging methods
  sendMessage: (receiverId: number, content: string) => Promise<Message>;
  getConversations: () => Promise<ConversationSummary[]>;
  getMessagesWithUser: (userId: number) => Promise<Message[]>;
  markMessageAsRead: (messageId: number) => Promise<Message>;
  // Discovery methods
  browseUsers: (params?: BrowseParams) => Promise<BrowseResponse>;
  likeUser: (userId: number) => Promise<InteractionResponse>;
  passUser: (userId: number) => Promise<InteractionResponse>;
  getUsersWhoLikedMe: () => Promise<UserProfile[]>;
  getMatches: () => Promise<MatchResponse[]>;
  unmatchUser: (userId: number) => Promise<UnmatchResponse>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  age: number;
  bio?: string;
  gender: string;
  location_latitude?: number;
  location_longitude?: number;
  photos?: string[];
  preferences?: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from AsyncStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
          setToken(storedToken);
          // Set default authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Fetch user data
          try {
            const response = await api.get('/auth/me');
            setUser(response.data);
            
            // Register for push notifications if user is already logged in
            initializePushNotifications(storedToken).catch(err => {
              console.error('Failed to initialize push notifications on app start:', err);
            });
          } catch (error) {
            // Token might be invalid, clear it
            await AsyncStorage.removeItem('authToken');
            setToken(null);
            delete api.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { access_token } = response.data;
      
      // Store token
      await AsyncStorage.setItem('authToken', access_token);
      setToken(access_token);
      
      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Fetch user data
      const userResponse = await api.get('/auth/me');
      setUser(userResponse.data);
      
      // Register for push notifications after successful login
      // Call asynchronously without blocking login
      initializePushNotifications(access_token).catch(err => {
        console.error('Failed to initialize push notifications:', err);
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const newUser = response.data;
      
      // Auto-login after registration
      await login(userData.email, userData.password);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Logout started');
      await AsyncStorage.removeItem('authToken');
      console.log('[Auth] Removed authToken from AsyncStorage');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
      console.log('[Auth] Cleared token, user, and Authorization header');
      // Allow state updates to flush before resetting navigation
      setTimeout(() => {
        try {
          const { resetToAuth } = require('../utils/navigation');
          resetToAuth();
          console.log('[Auth] Navigation reset to Auth stack');
        } catch (e) {
          console.log('[Auth] Navigation reset failed or not ready', e);
        }
      }, 0);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await api.put('/users/profile', userData);
      setUser(response.data);
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else {
        throw new Error('Update failed. Please try again.');
      }
    }
  };

  const updateUserPhotos = (photos: string[]) => {
    console.log('updateUserPhotos called with:', photos);
    if (user) {
      console.log('Updating user photos from:', user.photos, 'to:', photos);
      setUser({ ...user, photos });
    } else {
      console.log('No user found, cannot update photos');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      console.log('Refreshed user data:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  // Messaging methods
  const sendMessage = async (receiverId: number, content: string): Promise<Message> => {
    try {
      const response = await api.post('/messages/send', {
        receiver_id: receiverId,
        content: content
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(error.response?.data?.detail || 'Failed to send message');
    }
  };

  const getConversations = async (): Promise<ConversationSummary[]> => {
    try {
      const response = await api.get('/messages/conversations');
      return response.data;
    } catch (error: any) {
      console.error('Error getting conversations:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get conversations');
    }
  };

  const getMessagesWithUser = async (userId: number): Promise<Message[]> => {
    try {
      const response = await api.get(`/messages/conversation/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting messages:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get messages');
    }
  };

  const markMessageAsRead = async (messageId: number): Promise<Message> => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return response.data;
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      throw new Error(error.response?.data?.detail || 'Failed to mark message as read');
    }
  };

  // Discovery methods
  const browseUsers = async (params?: BrowseParams): Promise<BrowseResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params?.min_age !== undefined) queryParams.append('min_age', params.min_age.toString());
      if (params?.max_age !== undefined) queryParams.append('max_age', params.max_age.toString());
      if (params?.gender) queryParams.append('gender', params.gender);
      if (params?.max_distance !== undefined) queryParams.append('max_distance', params.max_distance.toString());
      
      const response = await api.get(`/discovery/browse?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error browsing users:', error);
      throw new Error(error.response?.data?.detail || 'Failed to browse users');
    }
  };

  const likeUser = async (userId: number): Promise<InteractionResponse> => {
    try {
      const response = await api.post(`/discovery/like/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error liking user:', error);
      throw new Error(error.response?.data?.detail || 'Failed to like user');
    }
  };

  const passUser = async (userId: number): Promise<InteractionResponse> => {
    try {
      const response = await api.post(`/discovery/pass/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error passing user:', error);
      throw new Error(error.response?.data?.detail || 'Failed to pass user');
    }
  };

  const getUsersWhoLikedMe = async (): Promise<UserProfile[]> => {
    try {
      const response = await api.get('/discovery/likes');
      return response.data;
    } catch (error: any) {
      console.error('Error getting users who liked me:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get users who liked you');
    }
  };

  const getMatches = async (): Promise<MatchResponse[]> => {
    try {
      const response = await api.get('/discovery/matches');
      return response.data;
    } catch (error: any) {
      console.error('Error getting matches:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get matches');
    }
  };

  const unmatchUser = async (userId: number): Promise<UnmatchResponse> => {
    try {
      const response = await api.delete(`/discovery/matches/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error unmatching user:', error);
      throw new Error(error.response?.data?.detail || 'Failed to unmatch user');
    }
  };

  const registerForPushNotifications = async (): Promise<void> => {
    try {
      if (!token) {
        console.warn('Cannot register for push notifications: no auth token');
        return;
      }
      await initializePushNotifications(token);
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      // Don't throw - push notifications are not critical for app functionality
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    updateUserPhotos,
    refreshUser,
    registerForPushNotifications,
    sendMessage,
    getConversations,
    getMessagesWithUser,
    markMessageAsRead,
    browseUsers,
    likeUser,
    passUser,
    getUsersWhoLikedMe,
    getMatches,
    unmatchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { api };
