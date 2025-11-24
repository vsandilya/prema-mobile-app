import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';
import GradientBackground from '../components/GradientBackground';

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

interface LikesScreenProps {
  navigation: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cardWidth = screenWidth - 40; // Account for horizontal margins
const photoHeight = screenHeight * 0.4;

const LikesScreen: React.FC<LikesScreenProps> = ({ navigation }) => {
  const { getUsersWhoLikedMe, likeUser, passUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [activePhotoIndices, setActivePhotoIndices] = useState<{ [key: number]: number }>({});
  const [likesCount, setLikesCount] = useState(0);

  const loadLikes = async () => {
    try {
      setIsLoading(true);
      const data = await getUsersWhoLikedMe();
      setUsers(data);
      setLikesCount(data.length);
      // Initialize photo indices
      const indices: { [key: number]: number } = {};
      data.forEach(user => {
        indices[user.id] = 0;
      });
      setActivePhotoIndices(indices);
    } catch (error: any) {
      console.error('Error loading likes:', error);
      Alert.alert('Error', error.message || 'Failed to load users who liked you');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLikes();
    }, [])
  );

  // Convert km to miles for display: miles = km * 0.621371
  const formatDistance = (distanceKm?: number) => {
    if (!distanceKm) return null;
    const distanceMiles = distanceKm * 0.621371;
    if (distanceMiles < 1) {
      return `${Math.round(distanceMiles * 5280)} feet away`;
    }
    return `${distanceMiles.toFixed(1)} miles away`;
  };

  const getImageUrl = (photoUrl: string) => {
    if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
      return `${API_BASE_URL}/${photoUrl.replace(/^\//, '')}`;
    }
    return photoUrl;
  };

  const handleLikeBack = async (user: UserProfile) => {
    if (isInteracting) return;
    
    setIsInteracting(true);
    try {
      const response = await likeUser(user.id);
      
      // Remove user from list
      setUsers(prev => prev.filter(u => u.id !== user.id));
      
      // Show match modal if it's a mutual match
      if (response.is_match) {
        setMatchedUser(user);
        setShowMatchModal(true);
      } else {
        Alert.alert('Liked!', `You liked ${user.name} back!`);
      }
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
      // Remove user from list
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (error: any) {
      console.error('Error passing user:', error);
      Alert.alert('Error', error.message || 'Failed to pass user');
    } finally {
      setIsInteracting(false);
    }
  };

  const updatePhotoIndex = (userId: number, index: number) => {
    setActivePhotoIndices(prev => ({
      ...prev,
      [userId]: index,
    }));
  };

  const renderUserCard = ({ item: user }: { item: UserProfile }) => {
    const photos = user.photos && user.photos.length > 0 ? user.photos : [];
    const activeIndex = activePhotoIndices[user.id] || 0;

    return (
      <View style={styles.userCard}>
        <View style={styles.photoContainer}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}
              onMomentumScrollEnd={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / cardWidth);
                updatePhotoIndex(user.id, Math.min(index, photos.length - 1));
              }}
            >
              {photos.map((photo, idx) => (
                <View key={`${photo}-${idx}`} style={styles.photoItem}>
                  <Image
                    source={{ uri: getImageUrl(photo) }}
                    style={styles.userPhoto}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.photoItem, styles.placeholderPhoto]}>
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

          {photos.length > 1 && (
            <View style={styles.photoPaginationContainer} pointerEvents="none">
              {photos.map((_, idx) => (
                <View
                  key={`dot-${idx}`}
                  style={[
                    styles.photoPaginationDot,
                    idx === activeIndex && styles.photoPaginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
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
            <Text style={styles.passButtonText}>Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.likeButton, isInteracting && styles.buttonDisabled]}
            onPress={() => handleLikeBack(user)}
            disabled={isInteracting}
          >
            <Text style={styles.likeButtonText}>Like Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
              onPress={() => {
                setShowMatchModal(false);
                loadLikes(); // Reload to refresh the list
              }}
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
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Likes</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Loading likes...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerCenter}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Browse')}
            >
              <Text style={styles.headerIconTextBrowse}>👓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Conversations')}
            >
              <Text style={styles.headerIconTextMessages}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Matches')}
            >
              <Text style={styles.headerIconTextMatches}>💞</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.headerIconTextProfile}>👤</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight} />
        </View>

        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💔</Text>
            <Text style={styles.emptyTitle}>No one has liked you yet</Text>
            <Text style={styles.emptySubtitle}>
              Start browsing to find people who might like you!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Browse')}
            >
              <Text style={styles.browseButtonText}>Start Browsing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        {renderMatchModal()}
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  headerLeft: {
    width: 40,
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
  headerIconTextBrowse: {
    fontSize: 24,
    color: '#5AC8FA',
  },
  headerIconTextMessages: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerIconTextLikes: {
    fontSize: 24,
    color: '#FF9500',
  },
  headerIconTextMatches: {
    fontSize: 24,
    color: '#FF2D87',
  },
  headerIconTextProfile: {
    fontSize: 24,
    color: '#9B59B6',
  },
  headerIconActive: {
    opacity: 0.6,
  },
  headerIconWithBadge: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    margin: 24,
    borderRadius: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: 'rgba(255,107,107,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  photoContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  photoScroll: {
    flexGrow: 0,
  },
  photoItem: {
    width: cardWidth,
    height: photoHeight,
  },
  userPhoto: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
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
  photoPaginationContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoPaginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  photoPaginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bioContainer: {
    padding: 20,
    paddingTop: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  bioText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.25)',
    gap: 12,
  },
  passButton: {
    flex: 1,
    backgroundColor: '#D4A574',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    flex: 1,
    backgroundColor: '#FF2D87',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  likeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255,255,255,0.92)',
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
    color: '#1F2933',
    marginBottom: 10,
  },
  matchSubtitle: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  matchActions: {
    flexDirection: 'row',
    gap: 15,
  },
  keepBrowsingButton: {
    backgroundColor: 'rgba(229,229,234,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  sendMessageButton: {
    backgroundColor: 'rgba(255,107,107,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  keepBrowsingButtonText: {
    color: '#1F2933',
    fontSize: 16,
    fontWeight: '600',
  },
  sendMessageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LikesScreen;

