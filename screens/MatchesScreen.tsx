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
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';

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
  const { getMatches } = useAuth();
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        <Text style={styles.matchName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.matchAge}>{item.age}</Text>
        <Text style={styles.matchDate}>
          {formatMatchDate(item.matched_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading your matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Matches</Text>
        <View style={styles.placeholder} />
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💔</Text>
          <Text style={styles.emptyTitle}>No Matches Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start browsing to find people who like you back!
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
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  matchesList: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  matchCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 15,
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
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  matchAge: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default MatchesScreen;
