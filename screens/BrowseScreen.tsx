import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RangeSlider from 'rn-range-slider';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { useLocationAutoUpdate } from '../hooks/useLocationAutoUpdate';


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

interface BrowseScreenProps {
  navigation: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BrowseScreen: React.FC<BrowseScreenProps> = ({ navigation }) => {
  const { browseUsers, likeUser, passUser, logout } = useAuth();
  const { initializeLocation } = useLocationAutoUpdate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  
  // Filter states
  const [maxDistance, setMaxDistance] = useState<number>(15); // in miles
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(80);
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);
  
  // Ref to track if filters have been loaded from storage
  const filtersLoadedRef = useRef(false);
  // Ref for debounce timer
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to track if initial load is done
  const initialLoadDoneRef = useRef(false);
  
  // Age range change handler
  const handleAgeRangeChange = useCallback((low: number, high: number) => {
    setMinAge(Math.round(low));
    setMaxAge(Math.round(high));
  }, []);

  // Convert km to miles for display: miles = km * 0.621371
  const formatDistance = (distanceKm?: number) => {
    if (!distanceKm) return null;
    const distanceMiles = distanceKm * 0.621371;
    if (distanceMiles < 1) {
      return `${Math.round(distanceMiles * 5280)} feet away`;
    }
    return `${distanceMiles.toFixed(1)} miles away`;
  };

  // Load saved filter preferences
  useEffect(() => {
    const loadSavedFilters = async () => {
      try {
        const savedFilters = await AsyncStorage.getItem('browseFilters');
        if (savedFilters) {
          const filters = JSON.parse(savedFilters);
          if (filters.maxDistance !== undefined) setMaxDistance(filters.maxDistance);
          if (filters.minAge !== undefined) setMinAge(filters.minAge);
          if (filters.maxAge !== undefined) setMaxAge(filters.maxAge);
        }
        // Mark filters as loaded (even if no saved data exists)
        filtersLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading filters:', error);
        // Mark as loaded even on error to allow future saves
        filtersLoadedRef.current = true;
      }
    };
    loadSavedFilters();
  }, []);

  // Save filters when they change
  const saveFilters = async () => {
    try {
      await AsyncStorage.setItem('browseFilters', JSON.stringify({
        maxDistance,
        minAge,
        maxAge,
      }));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params: any = { limit: 10 };
      
      if (maxDistance && maxDistance < 125) {
        // Convert miles to km for API: km = miles / 0.621371
        params.max_distance = Math.round(maxDistance / 0.621371);
      }
      if (minAge && minAge > 18) {
        params.min_age = Math.round(minAge);
      }
      if (maxAge && maxAge < 80) {
        params.max_age = Math.round(maxAge);
      }
      
      const response = await browseUsers(params);
      setUsers(response.users);
      setCurrentIndex(0);
      // Don't save filters here - only save when user explicitly changes them
    } catch (error: any) {
      console.error('Error loading users:', error);
      Alert.alert('Error', error.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  // Load users and update location when screen focuses
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        // Update location first to ensure fresh distance calculations
        const locationUpdated = await initializeLocation();
        if (locationUpdated) {
          // Wait a bit for location to persist to backend
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        loadUsers();
        // Mark initial load as done
        initialLoadDoneRef.current = true;
      };
      loadData();
    }, [])
  );

  // Reload users when filters change (debounced)
  useEffect(() => {
    // Skip the initial load - useFocusEffect handles it
    if (!initialLoadDoneRef.current) {
      return;
    }
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer to call loadUsers after 500ms of no changes
    debounceTimerRef.current = setTimeout(() => {
      loadUsers();
    }, 500);
    
    // Cleanup function to clear timeout
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [maxDistance, minAge, maxAge]);

  // Save filters to AsyncStorage when they change (after initial load)
  useEffect(() => {
    // Only save if filters have been loaded from storage first
    if (filtersLoadedRef.current) {
      saveFilters();
    }
  }, [maxDistance, minAge, maxAge]);

  const handleLike = async (user: UserProfile) => {
    if (isInteracting) return;
    
    setIsInteracting(true);
    try {
      const response = await likeUser(user.id);
      
      // Only show match modal if it's actually a mutual match
      if (response.is_match) {
        setMatchedUser(user);
        setShowMatchModal(true);
      }
      
      moveToNextUser();
    } catch (error: any) {
      console.error('Error liking user:', error);
      Alert.alert('Error', error.message || 'Failed to like user');
    } finally {
      setIsInteracting(false);
    }
  };

  const handlePass = async (user: UserProfile) => {
    if (isInteracting) return;
    
    setIsInteracting(true);
    try {
      await passUser(user.id);
      moveToNextUser();
    } catch (error: any) {
      console.error('Error passing user:', error);
      Alert.alert('Error', error.message || 'Failed to pass user');
    } finally {
      setIsInteracting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  const moveToNextUser = () => {
    setCurrentIndex(prev => prev + 1);
    
    // Load more users if we're near the end
    if (currentIndex >= users.length - 3) {
      loadMoreUsers();
    }
  };

  const loadMoreUsers = async () => {
    try {
      const response = await browseUsers({ skip: users.length, limit: 10 });
      setUsers(prev => [...prev, ...response.users]);
    } catch (error: any) {
      console.error('Error loading more users:', error);
    }
  };

  const getImageUrl = (photoUrl: string) => {
    if (photoUrl.startsWith('/uploads/')) {
      return `${API_BASE_URL}${photoUrl}`;
    }
    return photoUrl;
  };

  const renderUserCard = (user: UserProfile) => (
    <View style={styles.userCard}>
      <View style={styles.photoContainer}>
        {user.photos && user.photos.length > 0 ? (
          <Image
            source={{ uri: getImageUrl(user.photos[0]) }}
            style={styles.userPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderPhotoText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userAge}>{user.age} years old</Text>
          {formatDistance(user.distance_km) && (
            <Text style={styles.userDistance}>
              📍 {formatDistance(user.distance_km)}
            </Text>
          )}
        </View>
      </View>
      
      {user.bio && (
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.passButton, isInteracting && styles.buttonDisabled]}
          onPress={() => handlePass(user)}
          disabled={isInteracting}
        >
          <Text style={styles.passButtonText}>❌</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.likeButton, isInteracting && styles.buttonDisabled]}
          onPress={() => handleLike(user)}
          disabled={isInteracting}
        >
          <Text style={styles.likeButtonText}>❤️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMatchModal = () => (
    <Modal
      visible={showMatchModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowMatchModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.matchModal}>
          <Text style={styles.matchTitle}>🎉 It's a Match!</Text>
          <Text style={styles.matchSubtitle}>
            You and {matchedUser?.name} liked each other!
          </Text>
          
          <View style={styles.matchActions}>
            <TouchableOpacity
              style={styles.keepBrowsingButton}
              onPress={() => setShowMatchModal(false)}
            >
              <Text style={styles.keepBrowsingButtonText}>Keep Browsing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={() => {
                setShowMatchModal(false);
                navigation.navigate('Chat', { 
                  userId: matchedUser?.id, 
                  userName: matchedUser?.name 
                });
              }}
            >
              <Text style={styles.sendMessageButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Finding people near you...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentUser = users.length > 0 ? users[currentIndex] : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>⏻</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Conversations')}
          >
            <Text style={styles.headerIconText}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Matches')}
          >
            <Text style={styles.headerIconText}>💞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.headerIconText}>👤</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Collapsible Filter Section */}
      <View style={styles.filterContainer}>
        {/* Filter Summary Bar */}
        <TouchableOpacity
          style={styles.filterSummaryBar}
          onPress={() => setFiltersExpanded(!filtersExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.filterSummaryLeft}>
            <Text style={styles.filterSummaryText}>
              ⚙️ Preferences
            </Text>
            <Text style={styles.filterSummarySeparator}>•</Text>
            <Text style={styles.matchCount}>{users.length} matches</Text>
          </View>
          <View style={styles.filterSummaryRight}>
            <Text style={styles.chevron}>{filtersExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {/* Expanded Filter Controls */}
        {filtersExpanded && (
          <View style={styles.expandedFilters}>
            {/* Distance Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>📍 Within {Math.round(maxDistance)} miles</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={125}
                step={1}
                value={maxDistance}
                onValueChange={(value) => setMaxDistance(Math.round(value))}
                minimumTrackTintColor="#FF6B6B"
                maximumTrackTintColor="#E5E5EA"
                thumbTintColor="#FF6B6B"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1 mile</Text>
                <Text style={styles.sliderLabel}>125 miles</Text>
              </View>
            </View>

            {/* Age Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>🎂 Ages {Math.round(minAge)} - {Math.round(maxAge)}</Text>
              <RangeSlider
                min={18}
                max={80}
                step={1}
                low={minAge}
                high={maxAge}
                onValueChanged={handleAgeRangeChange}
                disableRange={false}
                renderThumb={() => <View style={styles.thumb} />}
                renderRail={() => <View style={styles.rail} />}
                renderRailSelected={() => <View style={styles.railSelected} />}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>18</Text>
                <Text style={styles.sliderLabel}>80</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {users.length === 0 ? (
          <View style={styles.noMatchesContainer}>
            <Text style={styles.noMatchesText}>😔 No matches found</Text>
            <Text style={styles.noMatchesSubtext}>Try adjusting your filters</Text>
          </View>
        ) : (
          currentUser && renderUserCard(currentUser)
        )}
      </ScrollView>

      {renderMatchModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 24,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  headerIconButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerIconText: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  userCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  photoContainer: {
    position: 'relative',
  },
  userPhoto: {
    width: '100%',
    height: screenHeight * 0.5,
  },
  placeholderPhoto: {
    width: '100%',
    height: screenHeight * 0.5,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderPhotoText: {
    fontSize: 80,
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userAge: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  userDistance: {
    fontSize: 14,
    color: '#fff',
  },
  bioContainer: {
    padding: 20,
    paddingTop: 15,
  },
  bioText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  passButton: {
    backgroundColor: '#E5E5EA',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    backgroundColor: '#FF6B6B',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButtonText: {
    fontSize: 45,
  },
  likeButtonText: {
    fontSize: 45,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  matchTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  matchSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  matchActions: {
    flexDirection: 'row',
    gap: 15,
  },
  keepBrowsingButton: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  sendMessageButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  keepBrowsingButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  sendMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  filterSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  filterSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterSummaryText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  filterSummarySeparator: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 8,
  },
  filterSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 12,
    color: '#666',
  },
  expandedFilters: {
    paddingTop: 10,
    paddingBottom: 15,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  thumb: {
    width: 20,
    height: 20,
    backgroundColor: '#34C759',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  rail: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  railSelected: {
    height: 6,
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  matchCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  noMatchesContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noMatchesText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  noMatchesSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default BrowseScreen;
