import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';

interface FullScreenPhotoModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FullScreenPhotoModal: React.FC<FullScreenPhotoModalProps> = ({
  visible,
  imageUri,
  onClose,
}) => {
  console.log('=== FULLSCREEN MODAL DEBUG ===');
  console.log('Modal visible:', visible);
  console.log('Modal imageUri:', imageUri);
  
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeButtonLarge} onPress={onClose}>
            <Text style={styles.closeButtonTextLarge}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight - 120, // Account for header and footer
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  closeButtonLarge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeButtonTextLarge: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FullScreenPhotoModal;
