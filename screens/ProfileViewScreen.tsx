import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import { formatDistance } from '../utils/formatting';

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
      fromSlotMachine?: boolean;
    };
  };
  navigation: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const photoWidth = screenWidth;
const MODAL_MAX_HEIGHT = screenHeight * 0.9;
const MODAL_CONTENT_HEIGHT = Math.min(screenHeight * 0.85, 600);

const ProfileViewScreen: React.FC<ProfileViewScreenProps> = ({ route, navigation }) => {
  const { user, fromSlotMachine } = route.params;
  const { likeUser, passUser, reportUser, blockUser } = useAuth();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const reportReasons = [
    { value: 'inappropriate_photos', label: 'Inappropriate photos' },
    { value: 'harassment', label: 'Harassment or abuse' },
    { value: 'fake_profile', label: 'Fake profile / Scam' },
    { value: 'underage', label: 'Underage user' },
    { value: 'other', label: 'Other' },
  ];

  const photos = user.photos && user.photos.length > 0 ? user.photos : [];

  const getImageUrl = (photoUrl: string) => {
    if (photoUrl.startsWith('/uploads/') || photoUrl.startsWith('uploads/')) {
      return `${API_BASE_URL}/${photoUrl.replace(/^\//, '')}`;
    }
    return photoUrl;
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
              text: fromSlotMachine ? 'Keep Spinning' : 'Keep Browsing',
              onPress: () => {
                if (fromSlotMachine) {
                  navigation.navigate('Browse');
                } else {
                  navigation.goBack();
                }
              },
            },
            {
              text: 'Send Message',
              onPress: () => {
                if (fromSlotMachine) {
                  navigation.navigate('Browse');
                } else {
                  navigation.goBack();
                }
                setTimeout(() => {
                  navigation.navigate('Chat', {
                    userId: user.id,
                    userName: user.name,
                  });
                }, 100);
              },
            },
          ]
        );
      } else {
        Alert.alert('Liked!', `You liked ${user.name}`, [
          { 
            text: 'OK', 
            onPress: () => {
              if (fromSlotMachine) {
                navigation.navigate('Browse');
              } else {
                navigation.goBack();
              }
            }
          },
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
      if (fromSlotMachine) {
        navigation.navigate('Browse');
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error passing user:', error);
      Alert.alert('Error', error.message || 'Failed to pass user');
    } finally {
      setIsInteracting(false);
    }
  };

  const handleReport = () => {
    setShowReportModal(true);
    setSelectedReason('');
    setReportDetails('');
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      'Block this user? You won\'t see their profile and they won\'t be able to contact you.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setIsBlocking(true);
            try {
              await blockUser(user.id);
              Alert.alert('User Blocked', 'User blocked', [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.navigate('Browse');
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', error.message || 'Failed to block user');
            } finally {
              setIsBlocking(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    setIsSubmittingReport(true);
    try {
      await reportUser(user.id, selectedReason, reportDetails || undefined);
      setShowReportModal(false);
      setSelectedReason('');
      setReportDetails('');
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep Prema safe. We will review your report.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with close button, block button, and report button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              style={styles.blockButton}
              onPress={handleBlock}
              disabled={isBlocking}
            >
              <Text style={styles.blockButtonText}>🚫</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={handleReport}
            >
              <Text style={styles.reportButtonText}>⚠️</Text>
            </TouchableOpacity>
          </View>
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

          {/* Action Buttons - Only show if from slot machine */}
          {fromSlotMachine && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.passButton, isInteracting && styles.buttonDisabled]}
                onPress={handlePass}
                disabled={isInteracting}
                activeOpacity={0.7}
              >
                <Text style={styles.passButtonText}>✕</Text>
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
          )}
        </ScrollView>

        {/* Report Modal */}
        <Modal
          visible={showReportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            Keyboard.dismiss();
            setShowReportModal(false);
          }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalKeyboardView}>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalKeyboardAvoidingView}
                  >
                    <View style={styles.modalContent}>
                    {/* Header with close button */}
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Report User</Text>
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => {
                          Keyboard.dismiss();
                          setShowReportModal(false);
                        }}
                        disabled={isSubmittingReport}
                      >
                        <Text style={styles.modalCloseButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      style={styles.modalScrollView}
                      contentContainerStyle={styles.modalScrollContent}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      <Text style={styles.modalSubtitle}>
                        Help us keep Prema safe by reporting inappropriate behavior
                      </Text>

                      <Text style={styles.reasonLabel}>Reason for reporting:</Text>
                      {reportReasons && reportReasons.length > 0 ? (
                        reportReasons.map((reason) => (
                          <TouchableOpacity
                            key={reason.value}
                            style={[
                              styles.reasonOption,
                              selectedReason === reason.value && styles.reasonOptionSelected,
                            ]}
                            onPress={() => setSelectedReason(reason.value)}
                          >
                            <Text
                              style={[
                                styles.reasonOptionText,
                                selectedReason === reason.value && styles.reasonOptionTextSelected,
                              ]}
                            >
                              {reason.label}
                            </Text>
                            {selectedReason === reason.value && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </TouchableOpacity>
                        ))
                      ) : null}

                      <Text style={styles.detailsLabel}>Additional details (optional):</Text>
                      <TextInput
                        style={styles.detailsInput}
                        value={reportDetails}
                        onChangeText={setReportDetails}
                        placeholder="Add details (optional)"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                        blurOnSubmit={true}
                      />
                    </ScrollView>

                    {/* Sticky buttons at bottom */}
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => {
                          Keyboard.dismiss();
                          setShowReportModal(false);
                        }}
                        disabled={isSubmittingReport}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalButton,
                          styles.submitButton,
                          (!selectedReason || isSubmittingReport) && styles.buttonDisabled,
                        ]}
                        onPress={handleSubmitReport}
                        disabled={!selectedReason || isSubmittingReport}
                      >
                        <Text style={styles.submitButtonText}>
                          {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    </View>
                  </KeyboardAvoidingView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  headerRightButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  blockButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockButtonText: {
    fontSize: 20,
  },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginTop: 10,
  },
  passButton: {
    backgroundColor: '#DC3545',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 70,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  passButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  likeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardView: {
    width: '100%',
    maxHeight: MODAL_MAX_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardAvoidingView: {
    width: '100%',
    maxHeight: MODAL_MAX_HEIGHT,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: MODAL_MAX_HEIGHT,
    height: MODAL_CONTENT_HEIGHT, // Set explicit height
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    flexShrink: 0, // Prevent header from shrinking
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
    minHeight: 300, // Minimum height to ensure content is visible
    backgroundColor: 'transparent', // Ensure background is visible
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1, // Allow content to grow and be scrollable
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    backgroundColor: '#E6F4FE',
    borderColor: '#007AFF',
  },
  reasonOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  reasonOptionTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  detailsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 12,
  },
  detailsInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    backgroundColor: '#fff',
    flexShrink: 0, // Prevent buttons from shrinking
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
  submitButton: {
    backgroundColor: '#FF6B6B',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ProfileViewScreen;

