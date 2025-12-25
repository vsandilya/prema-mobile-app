import React, { useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import GradientBackground from '../components/GradientBackground';
import { useAuth } from '../contexts/AuthContext';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, getUsersWhoLikedMe, getBlockedUsers, unblockUser, deleteAccount } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadLikesCount = async () => {
    try {
      const likes = await getUsersWhoLikedMe();
      setLikesCount(likes.length);
    } catch (error) {
      console.error('Error loading likes count:', error);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const blocked = await getBlockedUsers();
      setBlockedUsers(blocked);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLikesCount();
      loadBlockedUsers();
    }, [])
  );

  const handleUnblock = async (userId: number, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Unblock ${userName}? They will be able to see your profile and contact you again.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(userId);
              await loadBlockedUsers();
              Alert.alert('Success', `${userName} has been unblocked`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unblock user');
            }
          },
        },
      ]
    );
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account and all your data including matches, messages, and photos. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            setShowDeleteConfirm(true);
            setDeleteConfirmText('');
          },
        },
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" exactly to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      Alert.alert('Account Deleted', 'Your account has been deleted', [
        {
          text: 'OK',
          onPress: () => {
            // Navigation will be handled by auth state change
            // The logout will have already cleared the auth state
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getImageUrl = (photoUrl: string) => {
    if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
      return `${API_BASE_URL}/${photoUrl.replace(/^\//, '')}`;
    }
    return photoUrl;
  };

  const renderPhoto = ({ item }: { item: string }) => {
    const imageUrl = getImageUrl(item);
    return (
      <View style={styles.photoContainer}>
        <Image source={{ uri: imageUrl }} style={styles.photo} />
      </View>
    );
  };

  if (!user) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <Text style={styles.errorText}>No user data available</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
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
                  onPress={() => navigation.navigate('Matches')}
                >
                  <Text style={styles.headerIconTextMatches}>💞</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={styles.headerIconTextEdit}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={() => navigation.navigate('About')}
                >
                  <Text style={styles.headerIconTextAbout}>ℹ️</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.headerRight} />
            </View>

            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.age}>{user.age} years old</Text>
                <Text style={styles.gender}>{user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</Text>
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Me</Text>
              <View style={styles.sectionContent}>
                {user.bio ? (
                  <Text style={styles.bio}>{user.bio}</Text>
                ) : (
                  <Text style={styles.placeholder}>No bio added yet</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <View style={styles.sectionContent}>
                {user.photos && user.photos.length > 0 ? (
                  <View>
                    <Text style={styles.photoCount}>
                      📸 {user.photos.length} photo{user.photos.length !== 1 ? 's' : ''} uploaded
                    </Text>
                    <FlatList
                      data={user.photos}
                      renderItem={renderPhoto}
                      keyExtractor={(item, index) => `${item}-${index}`}
                      numColumns={3}
                      scrollEnabled={false}
                      contentContainerStyle={styles.photosGrid}
                    />
                  </View>
                ) : (
                  <Text style={styles.placeholder}>No photos uploaded yet</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Info</Text>
              <View style={styles.sectionContent}>
                <Text style={styles.accountInfo}>
                  Member since: {formatDate(user.created_at)}
                </Text>
                <Text style={styles.accountInfo}>
                  Status: {user.is_active ? 'Active' : 'Inactive'}
                </Text>
                {user.updated_at && (
                  <Text style={styles.accountInfo}>
                    Last updated: {formatDate(user.updated_at)}
                  </Text>
                )}
              </View>
            </View>

            {blockedUsers.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={() => setShowBlockedUsers(!showBlockedUsers)}
                  style={styles.blockedHeader}
                >
                  <Text style={styles.sectionTitle}>
                    Blocked Users ({blockedUsers.length})
                  </Text>
                  <Text style={styles.toggleText}>
                    {showBlockedUsers ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
                {showBlockedUsers && (
                  <View style={styles.blockedList}>
                    {blockedUsers.map((blocked) => (
                      <View key={blocked.id} style={styles.blockedItem}>
                        <View style={styles.blockedUserInfo}>
                          <Text style={styles.blockedUserName}>
                            {blocked.blocked_user_name}
                          </Text>
                          <Text style={styles.blockedDate}>
                            Blocked {formatDate(blocked.created_at)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.unblockButton}
                          onPress={() =>
                            handleUnblock(blocked.blocked_user_id, blocked.blocked_user_name)
                          }
                        >
                          <Text style={styles.unblockButtonText}>Unblock</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>

        {/* Delete Account Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirm Deletion</Text>
              <Text style={styles.modalMessage}>
                Type "DELETE" to confirm you want to permanently delete your account:
              </Text>
              <TextInput
                style={styles.deleteInput}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="Type DELETE"
                autoCapitalize="characters"
                editable={!isDeleting}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.deleteButton,
                    (deleteConfirmText !== 'DELETE' || isDeleting) && styles.buttonDisabled
                  ]}
                  onPress={handleConfirmDelete}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                >
                  <Text style={styles.deleteButtonText}>
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: 'transparent',
  },
  scrollContent: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  content: {
    padding: 20,
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
    marginBottom: 20,
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
    paddingHorizontal: 6,
  },
  headerIconTextBrowse: {
    fontSize: 22,
    color: '#5AC8FA',
  },
  headerIconTextMessages: {
    fontSize: 22,
    color: '#007AFF',
  },
  headerIconTextLikes: {
    fontSize: 22,
    color: '#FF9500',
  },
  headerIconTextMatches: {
    fontSize: 22,
    color: '#FF2D87',
  },
  headerIconTextProfile: {
    fontSize: 22,
    color: '#9B59B6',
  },
  headerIconTextEdit: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  headerIconTextAbout: {
    fontSize: 22,
    color: '#34C759',
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
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  age: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  gender: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#007AFF',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionContent: {
    marginTop: 4,
  },
  bio: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  photoCount: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  photosGrid: {
    paddingTop: 8,
  },
  photoContainer: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  accountInfo: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 50,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  blockedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    color: '#007AFF',
  },
  blockedList: {
    marginTop: 12,
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  blockedUserInfo: {
    flex: 1,
  },
  blockedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 14,
    color: '#666',
  },
  unblockButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteAccountButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ProfileScreen;
