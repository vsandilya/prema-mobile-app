import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import GradientBackground from '../components/GradientBackground';
import { API_BASE_URL } from '../config';
import { formatDistance } from '../utils/formatting';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UserProfile {
  id: number;
  name: string;
  age: number;
  bio?: string;
  gender: string;
  location_latitude?: number;
  location_longitude?: number;
  photos?: string[];
  primary_photo?: number;
  distance_km?: number;
}

interface SpinResponse {
  success: boolean;
  profile?: UserProfile;
  spins_remaining: number;
  message: string;
}

interface SpinsStatusResponse {
  spins_remaining: number;
  resets_at: string;
}

const HEART_SYMBOLS = ['❤️', '💕', '💖', '💝', '💗'];
const REEL_HEIGHT = 120;
const SYMBOL_HEIGHT = 40;

const SlotMachineScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { spin, getSpinStatus, likeUser, passUser } = useAuth();
  const [spinsRemaining, setSpinsRemaining] = useState(15);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Animation values for three reels
  const reel1Anim = useRef(new Animated.Value(0)).current;
  const reel2Anim = useRef(new Animated.Value(0)).current;
  const reel3Anim = useRef(new Animated.Value(0)).current;
  
  // Profile reveal animation
  const profileAnim = useRef(new Animated.Value(0)).current;

  // Load spin status on screen focus
  useFocusEffect(
    React.useCallback(() => {
      loadSpinStatus();
    }, [])
  );

  const loadSpinStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const status = await getSpinStatus();
      setSpinsRemaining(status.spins_remaining);
    } catch (error: any) {
      console.error('Error loading spin status:', error);
      Alert.alert('Error', error.message || 'Failed to load spin status');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const getImageUrl = (photoUrl: string) => {
    if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
      return `${API_BASE_URL}/${photoUrl.replace(/^\//, '')}`;
    }
    return photoUrl;
  };

  const animateReel = (animValue: Animated.Value, duration: number, delay: number = 0) => {
    return Animated.timing(animValue, {
      toValue: -1000, // Spin multiple times
      duration,
      delay,
      useNativeDriver: true,
    });
  };

  const stopReel = (animValue: Animated.Value, finalPosition: number) => {
    return Animated.timing(animValue, {
      toValue: finalPosition,
      duration: 500,
      useNativeDriver: true,
    });
  };

  const handleSpin = async () => {
    if (isSpinning || spinsRemaining <= 0) return;

    setIsSpinning(true);
    setShowProfile(false);
    setCurrentProfile(null);

    try {
      // Start all reels spinning
      const spinDuration = 2500;
      const spin1 = animateReel(reel1Anim, spinDuration);
      const spin2 = animateReel(reel2Anim, spinDuration, 200);
      const spin3 = animateReel(reel3Anim, spinDuration, 400);

      Animated.parallel([spin1, spin2, spin3]).start();

      // Call API after a short delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const response: SpinResponse = await spin();

      // Update spins remaining
      setSpinsRemaining(response.spins_remaining);

      // Stop reels with staggered timing
      const stop1 = stopReel(reel1Anim, -SYMBOL_HEIGHT * 2);
      const stop2 = stopReel(reel2Anim, -SYMBOL_HEIGHT * 2);
      const stop3 = stopReel(reel3Anim, -SYMBOL_HEIGHT * 2);

      // Stop reel 1 first
      setTimeout(() => {
        stop1.start();
      }, spinDuration);

      // Stop reel 2
      setTimeout(() => {
        stop2.start();
      }, spinDuration + 300);

      // Stop reel 3 and reveal profile
      setTimeout(() => {
        stop3.start(() => {
          setIsSpinning(false);
          
          if (response.success && response.profile) {
            setCurrentProfile(response.profile);
            // Animate profile reveal
            Animated.spring(profileAnim, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }).start();
            setShowProfile(true);
          } else {
            Alert.alert('No Spins', response.message || 'No spins remaining! Come back tomorrow.');
          }
        });
      }, spinDuration + 600);
    } catch (error: any) {
      console.error('Error spinning:', error);
      setIsSpinning(false);
      Alert.alert('Error', error.message || 'Failed to spin. Please try again.');
    }
  };

  const handleLike = async () => {
    if (!currentProfile || isInteracting) return;
    
    setIsInteracting(true);
    try {
      const response = await likeUser(currentProfile.id);
      
      // Hide profile
      Animated.timing(profileAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowProfile(false);
        setCurrentProfile(null);
      });

      // Show match modal if it's a match
      if (response.is_match) {
        setTimeout(() => {
          Alert.alert(
            '🎉 It\'s a Match!',
            `You and ${currentProfile.name} liked each other!`,
            [
              {
                text: 'Keep Spinning',
                style: 'cancel',
              },
              {
                text: 'Send Message',
                onPress: () => {
                  navigation.navigate('Chat', {
                    userId: currentProfile.id,
                    userName: currentProfile.name,
                  });
                },
              },
            ]
          );
        }, 350);
      }
    } catch (error: any) {
      console.error('Error liking user:', error);
      Alert.alert('Error', error.message || 'Failed to like user');
    } finally {
      setIsInteracting(false);
    }
  };

  const handlePass = async () => {
    if (!currentProfile || isInteracting) return;
    
    setIsInteracting(true);
    try {
      await passUser(currentProfile.id);
      
      // Hide profile
      Animated.timing(profileAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowProfile(false);
        setCurrentProfile(null);
      });
    } catch (error: any) {
      console.error('Error passing user:', error);
      Alert.alert('Error', error.message || 'Failed to pass user');
    } finally {
      setIsInteracting(false);
    }
  };

  const renderReel = (animValue: Animated.Value, index: number) => {
    // Create extended symbol list for smooth scrolling
    const extendedSymbols = [...HEART_SYMBOLS, ...HEART_SYMBOLS, ...HEART_SYMBOLS];
    
    return (
      <View style={styles.reelContainer}>
        <View style={styles.reelMask}>
          <Animated.View
            style={[
              styles.reelContent,
              {
                transform: [
                  {
                    translateY: animValue.interpolate({
                      inputRange: [-1000, 0],
                      outputRange: [-1000, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            {extendedSymbols.map((symbol, i) => (
              <View key={`symbol-${index}-${i}`} style={styles.symbolContainer}>
                <Text style={styles.symbol}>{symbol}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderProfileCard = () => {
    if (!currentProfile) return null;

    const photos = currentProfile.photos && currentProfile.photos.length > 0 
      ? currentProfile.photos 
      : [];
    const primaryPhotoIndex = currentProfile.primary_photo || 0;
    const displayPhoto = photos.length > 0 
      ? photos[primaryPhotoIndex] || photos[0]
      : null;

    const profileScale = profileAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    const profileOpacity = profileAnim;

    return (
      <Animated.View
        style={[
          styles.profileCard,
          {
            opacity: profileOpacity,
            transform: [{ scale: profileScale }],
          },
        ]}
      >
        <ScrollView 
          style={styles.profileScrollView}
          contentContainerStyle={styles.profileScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profilePhotoContainer}>
            {displayPhoto ? (
              <Image
                source={{ uri: getImageUrl(displayPhoto) }}
                style={styles.profilePhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderPhoto}>
                <Text style={styles.placeholderPhotoText}>
                  {currentProfile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentProfile.name}</Text>
            <Text style={styles.profileAge}>{currentProfile.age} years old</Text>
            {formatDistance(currentProfile.distance_km) && (
              <Text style={styles.profileDistance}>
                📍 {formatDistance(currentProfile.distance_km)}
              </Text>
            )}
            {currentProfile.bio && (
              <Text style={styles.profileBio} numberOfLines={3}>
                {currentProfile.bio}
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.profileActions}>
          <TouchableOpacity
            style={[styles.passButton, isInteracting && styles.buttonDisabled]}
            onPress={handlePass}
            disabled={isInteracting}
            activeOpacity={0.7}
          >
            <Text style={styles.passButtonText}>❌</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.likeButton, isInteracting && styles.buttonDisabled]}
            onPress={handleLike}
            disabled={isInteracting}
            activeOpacity={0.7}
          >
            <Text style={styles.likeButtonText}>❤️</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  if (isLoadingStatus) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <View style={styles.headerCenter}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Conversations')}
            >
              <Text style={styles.headerIconTextMessages}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Likes')}
            >
              <Text style={styles.headerIconTextLikes}>🔥</Text>
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

        {/* Title and Spin Counter */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🎰 Spin for Love</Text>
          <Text style={styles.spinCounter}>
            {spinsRemaining > 0 ? `🎰 ${spinsRemaining} spins remaining` : 'Come back tomorrow!'}
          </Text>
        </View>

        {/* Slot Machine */}
        {!showProfile && (
          <View style={styles.slotMachineContainer}>
            <View style={styles.slotMachineFrame}>
              <View style={styles.reelsContainer}>
                {renderReel(reel1Anim, 0)}
                {renderReel(reel2Anim, 1)}
                {renderReel(reel3Anim, 2)}
              </View>
            </View>

            {/* Spin Button */}
            <TouchableOpacity
              style={[
                styles.spinButton,
                (isSpinning || spinsRemaining <= 0) && styles.spinButtonDisabled,
              ]}
              onPress={handleSpin}
              disabled={isSpinning || spinsRemaining <= 0}
            >
              <Text style={styles.spinButtonText}>
                {isSpinning ? 'SPINNING...' : 'SPIN'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Profile Card */}
        {showProfile && renderProfileCard()}
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
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
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spinCounter: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  slotMachineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  slotMachineFrame: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  reelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: screenWidth - 80,
  },
  reelContainer: {
    width: (screenWidth - 120) / 3,
    height: REEL_HEIGHT,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  reelMask: {
    height: REEL_HEIGHT,
    overflow: 'hidden',
  },
  reelContent: {
    alignItems: 'center',
  },
  symbolContainer: {
    height: SYMBOL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 32,
  },
  spinButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  spinButtonDisabled: {
    backgroundColor: '#666',
    borderColor: '#444',
    opacity: 0.6,
  },
  spinButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  profileCard: {
    flex: 1,
    margin: 20,
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
  profileScrollView: {
    flex: 1,
  },
  profileScrollContent: {
    flexGrow: 1,
  },
  profilePhotoContainer: {
    width: '100%',
    height: screenHeight * 0.4,
    maxHeight: 400,
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderPhotoText: {
    fontSize: 80,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileInfo: {
    padding: 20,
    backgroundColor: 'rgba(255, 182, 193, 0.9)',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  profileAge: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    minHeight: 80,
  },
  passButton: {
    backgroundColor: '#DC3545',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  likeButton: {
    backgroundColor: '#28A745',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  passButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  likeButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default SlotMachineScreen;

