import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

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

interface ProfileViewScreenProps {
  route: {
    params: {
      user: UserProfile;
    };
  };
  navigation: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const photoWidth = screenWidth;

const ProfileViewScreen: React.FC<ProfileViewScreenProps> = ({ route, navigation }) => {
  const { user } = route.params;
  const { likeUser, passUser } = useAuth();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const photos = user.photos && user.photos.length > 0 ? user.photos : [];

  const getImageUrl = (photoUrl: string) => {
    if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
      return `${API_BASE_URL}/${photoUrl.replace(/^\//, '')}`;
    }
    return photoUrl;
  };

  const formatDistance = (distanceKm?: number) => {
    if (!distanceKm) return null;
    const distanceMiles = distanceKm * 0.621371;
    if (distanceMiles < 1) {
      return `${Math.round(distanceMiles * 5280)} feet away`;
    }
    return `${distanceMiles.toFixed(1)} miles away`;
  };

  const handleLike = async () => {
    if (isInteracting) return;
    
    setIsInteracting(true);
    try {
      const response = await likeUser(user.id);
      if (response.is_match) {
        Alert.alert(
          '🎉 It\'s a Match!',
          `You and ${user.name} liked each other!`,
          [
            {
              text: 'Keep Browsing',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Send Message',
              onPress: () => {
                navigation.goBack();
                navigation.navigate('Chat', {
                  userId: user.id,
                  userName: user.name,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Liked!', `You liked ${user.name}`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error('Error liking user:', error);
      Alert.alert('Error', error.message || 'Failed to like user');
    } finally {
      setIsInteracting(false);
    }
  };

  const handlePass = async () => {
    if (isInteracting) return;
    
    setIsInteracting(true);
    try {
      await passUser(user.id);
      navigation.goBack();
    } catch (error: any) {
      console.error('Error passing user:', error);
      Alert.alert('Error', error.message || 'Failed to pass user');
    } finally {
      setIsInteracting(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with close button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Carousel */}
          <View style={styles.photoContainer}>
            {photos.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.photoScroll}
                onMomentumScrollEnd={(event) => {
                  const offsetX = event.nativeEvent.contentOffset.x;
                  const index = Math.round(offsetX / photoWidth);
                  setActivePhotoIndex(Math.min(index, photos.length - 1));
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

            {photos.length > 1 && (
              <View style={styles.photoPaginationContainer} pointerEvents="none">
                {photos.map((_, idx) => (
                  <View
                    key={`dot-${idx}`}
                    style={[
                      styles.photoPaginationDot,
                      idx === activePhotoIndex && styles.photoPaginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* User Details - Below photos */}
          <View style={styles.detailsContainer}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userAge}>{user.age} years old</Text>
            
            {formatDistance(user.distance_km) && (
              <Text style={styles.userDistance}>
                📍 {formatDistance(user.distance_km)}
              </Text>
            )}

            {user.bio && (
              <Text style={styles.bioText}>{user.bio}</Text>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.passButton, isInteracting && styles.buttonDisabled]}
            onPress={handlePass}
            disabled={isInteracting}
          >
            <Text style={styles.passButtonText}>✕</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.likeButton, isInteracting && styles.buttonDisabled]}
            onPress={handleLike}
            disabled={isInteracting}
          >
            <Text style={styles.likeButtonText}>❤️</Text>
          </TouchableOpacity>
        </View>
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for fixed buttons
  },
  photoContainer: {
    position: 'relative',
    height: screenHeight * 0.6,
    overflow: 'hidden',
  },
  photoScroll: {
    flexGrow: 0,
  },
  photoItem: {
    width: photoWidth,
    height: screenHeight * 0.6,
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
    fontSize: 100,
    color: '#fff',
    fontWeight: 'bold',
  },
  photoPaginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPaginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  photoPaginationDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 182, 193, 0.9)',
    padding: 20,
    paddingTop: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userAge: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  passButton: {
    backgroundColor: '#D4A574',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  likeButton: {
    backgroundColor: '#FF2D87',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  passButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  likeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ProfileViewScreen;

