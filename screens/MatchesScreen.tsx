import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import GradientBackground from '../components/GradientBackground';

interface MatchResponse {
  id: number;
  name: string;
  age: number;
  bio?: string;
  photos?: string[];
  matched_at: string;
}

interface MatchesScreenProps {
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 2; // 2 columns with margins

const MatchesScreen: React.FC<MatchesScreenProps> = ({ navigation }) => {
  const { getMatches, unmatchUser, getUsersWhoLikedMe } = useAuth();
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const loadLikesCount = async () => {
    try {
      const likes = await getUsersWhoLikedMe();
      setLikesCount(likes.length);
    } catch (error) {
      console.error('Error loading likes count:', error);
    }
  };

  const loadMatches = async () => {
    try {
      const data = await getMatches();
      setMatches(data);
    } catch (error: any) {
      console.error('Error loading matches:', error);
      Alert.alert('Error', error.message || 'Failed to load matches');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMatches();
  }, []);

  // Load matches when screen focuses
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadMatches();
      loadLikesCount();
    }, [])
  );

  const formatMatchDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getImageUrl = (photoUrl: string) => {
    if (photoUrl.startsWith('/uploads/')) {
      return `${API_BASE_URL}${photoUrl}`;
    }
    return photoUrl;
  };

  const confirmUnmatch = (match: MatchResponse) => {
    Alert.alert(
      'Unmatch',
      `Are you sure you want to unmatch with ${match.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await unmatchUser(match.id);
              setMatches(prevMatches => prevMatches.filter(m => m.id !== match.id));
              Alert.alert('Unmatched', response?.message || `You unmatched with ${match.name}.`);
            } catch (error: any) {
              console.error('Error unmatching user:', error);
              Alert.alert('Error', error.message || 'Failed to unmatch. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderMatchCard = ({ item }: { item: MatchResponse }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => navigation.navigate('Chat', { 
        userId: item.id, 
        userName: item.name 
      })}
      activeOpacity={0.8}
    >
      <View style={styles.photoContainer}>
        {item.photos && item.photos.length > 0 ? (
          <Image
            source={{ uri: getImageUrl(item.photos[0]) }}
            style={styles.matchPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderPhotoText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>💕</Text>
        </View>
      </View>
      
      <View style={styles.matchInfo}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchName} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            style={styles.unmatchButton}
            onPress={() => confirmUnmatch(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.unmatchButtonText}>✖️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.matchAge}>{item.age}</Text>
        <Text style={styles.matchDate}>
          {formatMatchDate(item.matched_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Loading your matches...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
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
              onPress={() => {
                navigation.navigate('Likes');
                loadLikesCount();
              }}
            >
              <View style={styles.headerIconWithBadge}>
                <Text style={styles.headerIconTextLikes}>🔥</Text>
                {likesCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {likesCount > 99 ? '99+' : likesCount}
                    </Text>
                  </View>
                )}
              </View>
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

        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💔</Text>
            <Text style={styles.emptySubtitle}>
              Start browsing, people want to know you
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
            data={matches}
            renderItem={renderMatchCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.matchesList}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            columnWrapperStyle={styles.row}
          />
        )}
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
  matchesList: {
    padding: 20,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
  },
  matchCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    width: cardWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  photoContainer: {
    position: 'relative',
    height: cardWidth * 1.2, // Make photos slightly taller than wide
  },
  matchPhoto: {
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
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadgeText: {
    fontSize: 16,
  },
  matchInfo: {
    padding: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 0,
    marginRight: 8,
  },
  matchAge: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  unmatchButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  unmatchButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchesScreen;
