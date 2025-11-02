import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';

interface FullScreenPhotoScreenProps {
  route: {
    params: {
      imageUri: string;
    };
  };
  navigation: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FullScreenPhotoScreen: React.FC<FullScreenPhotoScreenProps> = ({
  route,
  navigation,
}) => {
  const { imageUri } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => navigation.goBack()}
        >
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
        <TouchableOpacity 
          style={styles.closeButtonLarge} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonTextLarge}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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

export default FullScreenPhotoScreen;
