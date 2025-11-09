import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, api } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import * as Location from 'expo-location';

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, updateUser, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    bio: '',
    gender: '',
    seeking_gender: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [processingPhotoIds, setProcessingPhotoIds] = useState<string[]>([]);

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non-binary', value: 'non-binary' },
    { label: 'Other', value: 'other' },
  ];

  const seekingGenderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Everyone', value: 'both' },
  ];

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age?.toString() || '',
        bio: user.bio || '',
        gender: user.gender || '',
        seeking_gender: user.seeking_gender || 'both',
      });
      setPhotos(user.photos || []);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.age.trim() || !formData.gender.trim() || !formData.seeking_gender.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18) {
      Alert.alert('Error', 'You must be at least 18 years old');
      return false;
    }

    return true;
  };

  const handleUpdateLocation = async () => {
    setIsUpdatingLocation(true);
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to update your location');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Update user profile with new location
      await updateUser({
        location_latitude: latitude,
        location_longitude: longitude,
      });

      Alert.alert('Success', 'Location updated successfully!');
    } catch (error: any) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location. Please try again.');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to upload photos');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingPhotos(true);
        let latestPhotos = [...photos];

        for (const asset of result.assets) {
          try {
            const uri = asset.uri;
            if (!uri) continue;

            const mimeType = asset.mimeType || 'image/jpeg';
            const extensionFromName = asset.fileName?.split('.').pop()?.toLowerCase();
            let extension = extensionFromName || mimeType.split('/')[1] || 'jpg';
            if (extension === 'jpg') extension = 'jpeg';
            const fileName = asset.fileName || `photo_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;

            const formData = new FormData();
            formData.append('file', {
              uri,
              name: fileName,
              type: mimeType,
            } as any);

            const response = await api.post('/users/photos/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });

            if (response.data?.photos && Array.isArray(response.data.photos)) {
              latestPhotos = response.data.photos;
            } else if (response.data?.url) {
              latestPhotos = [...latestPhotos, response.data.url];
            }

            setPhotos(latestPhotos);
          } catch (uploadError) {
            console.error('Error uploading photo:', uploadError);
            Alert.alert('Upload Failed', 'Failed to upload one of the selected photos. Please try again.');
            break;
          }
        }

        await refreshUser();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const removePhoto = async (index: number) => {
    const photoUrl = photos[index];
    if (!photoUrl) return;

    // Extract filename from URL
    const match = photoUrl.match(/\/uploads\/?([^\/]+)$/);
    const filename = match ? match[1] : null;

    if (!filename) {
      Alert.alert('Error', 'Unable to determine photo filename for deletion.');
      return;
    }

    setProcessingPhotoIds((prev) => [...prev, filename]);

    try {
      await api.delete(`/users/photos/${filename}`);

      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);

      await refreshUser();
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo. Please try again.');
    } finally {
      setProcessingPhotoIds((prev) => prev.filter((id) => id !== filename));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Update profile fields
      await updateUser({
        name: formData.name.trim(),
        age: parseInt(formData.age),
        bio: formData.bio.trim() || undefined,
        gender: formData.gender,
        seeking_gender: formData.seeking_gender,
      });

      // Refresh user data to ensure consistency
      await refreshUser();

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (photoUrl: string) => {
    // Convert relative URL to full URL
    if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
      return `${API_BASE_URL}/${photoUrl.replace(/^\//, '')}`;
    }
    // If it's already a full URL or a local file URI, return as is
    return photoUrl;
  };

  const renderPhoto = ({ item, index }: { item: string; index: number }) => {
    const imageUrl = getImageUrl(item);
    return (
      <View style={styles.photoContainer}>
        <Image source={{ uri: imageUrl }} style={styles.photo} />
        <TouchableOpacity
          style={styles.removePhotoButton}
          onPress={() => removePhoto(index)}
          disabled={processingPhotoIds.includes(item)}
        >
          {processingPhotoIds.includes(item) ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.removePhotoButtonText}>✕</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            </View>

            {/* Age */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(value) => handleInputChange('age', value)}
                placeholder="Enter your age"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            {/* Gender */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      formData.gender === option.value && styles.genderOptionSelected
                    ]}
                    onPress={() => handleInputChange('gender', option.value)}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.gender === option.value && styles.genderOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>I'm seeking *</Text>
              <View style={styles.genderContainer}>
                {seekingGenderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      formData.seeking_gender === option.value && styles.genderOptionSelected
                    ]}
                    onPress={() => handleInputChange('seeking_gender', option.value)}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.seeking_gender === option.value && styles.genderOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bio */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Location Update Button */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity
                style={[styles.locationButton, isUpdatingLocation && styles.buttonDisabled]}
                onPress={handleUpdateLocation}
                disabled={isUpdatingLocation}
              >
                {isUpdatingLocation ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.locationButtonText}>📍 Update My Location</Text>
                )}
              </TouchableOpacity>
              {user?.location_latitude && user?.location_longitude && (
                <Text style={styles.locationInfo}>
                  Current: {user.location_latitude.toFixed(4)}, {user.location_longitude.toFixed(4)}
                </Text>
              )}
            </View>

            {/* Photos */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Photos</Text>
              <TouchableOpacity
                style={[styles.addPhotoButton, isUploadingPhotos && styles.buttonDisabled]}
                onPress={pickImage}
                disabled={isUploadingPhotos}
              >
                {isUploadingPhotos ? (
                  <ActivityIndicator color="#007AFF" />
                ) : (
                  <Text style={styles.addPhotoButtonText}>➕ Add Photos</Text>
                )}
              </TouchableOpacity>
              {photos.length > 0 && (
                <View style={styles.photosContainer}>
                  <FlatList
                    data={photos}
                    renderItem={renderPhoto}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={styles.photosGrid}
                  />
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
  locationButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  addPhotoButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  addPhotoButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  photosContainer: {
    marginTop: 8,
  },
  photosGrid: {
    paddingTop: 8,
  },
  photoContainer: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default EditProfileScreen;

