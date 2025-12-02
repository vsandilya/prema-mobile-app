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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';

interface ConversationSummary {
  user_id: number;
  user_name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface ConversationsScreenProps {
  navigation: any;
}

const ConversationsScreen: React.FC<ConversationsScreenProps> = ({ navigation }) => {
  const { getConversations, getUsersWhoLikedMe } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
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

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', error.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadConversations();
  }, []);

  // Load conversations when screen focuses
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadConversations();
      loadLikesCount();
    }, [])
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const renderConversation = ({ item }: { item: ConversationSummary }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Chat', { userId: item.user_id, userName: item.user_name })}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.user_name)}</Text>
        </View>
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {item.unread_count > 99 ? '99+' : item.unread_count}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.user_name}</Text>
          {item.last_message_time && (
            <Text style={styles.timestamp}>
              {formatTimestamp(item.last_message_time)}
            </Text>
          )}
        </View>
        
        <View style={styles.lastMessageContainer}>
          <Text 
            style={[
              styles.lastMessage,
              item.unread_count > 0 && styles.unreadMessage
            ]}
            numberOfLines={2}
          >
            {item.last_message || 'No messages yet'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
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

        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No Conversations</Text>
            <Text style={styles.emptySubtitle}>
              Start chatting with someone to see your conversations here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.user_id.toString()}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContainer}
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
    fontSize: 60,
    marginBottom: 16,
    color: '#FFFFFF',
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
  },
  listContainer: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    margin: 16,
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: 'rgba(255,107,107,0.85)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
});

export default ConversationsScreen;
