import React from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuth();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getImageUrl = (photoUrl: string) => {
    // Convert relative URL to full URL
    if (photoUrl.startsWith('/uploads/')) {
      return `http://192.168.30.238:8000${photoUrl}`;
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
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Browse')}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>My Profile</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
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

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 24,
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
});

export default ProfileScreen;
