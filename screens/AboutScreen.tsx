import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';

interface AboutScreenProps {
  navigation: any;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About Prema</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Community Guidelines Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Community Guidelines</Text>
              
              <View style={styles.guidelineItem}>
                <Text style={styles.guidelineIcon}>✨</Text>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineTitle}>Be Real</Text>
                  <Text style={styles.guidelineText}>
                    Authentic photos, honest profiles, genuine connections.
                  </Text>
                </View>
              </View>

              <View style={styles.guidelineItem}>
                <Text style={styles.guidelineIcon}>💚</Text>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineTitle}>Be Kind</Text>
                  <Text style={styles.guidelineText}>
                    Respect everyone, no harassment, move on gracefully.
                  </Text>
                </View>
              </View>

              <View style={styles.guidelineItem}>
                <Text style={styles.guidelineIcon}>🛡️</Text>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineTitle}>Be Safe</Text>
                  <Text style={styles.guidelineText}>
                    Meet in public, trust your gut, report concerns.
                  </Text>
                </View>
              </View>
            </View>

            {/* About Prema Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Prema</Text>
              
              <View style={styles.guidelineItem}>
                <Text style={styles.guidelineIcon}>🌌</Text>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineTitle}>No Algorithms</Text>
                  <Text style={styles.guidelineText}>
                    We believe in the universe's all-knowing algorithm to get you matched up. What's meant to be will be.
                  </Text>
                </View>
              </View>

              <View style={styles.guidelineItem}>
                <Text style={styles.guidelineIcon}>🆓</Text>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineTitle}>Free to Use</Text>
                  <Text style={styles.guidelineText}>
                    There is currently no option to pay for anything in this app, but that could change as we grow.
                  </Text>
                </View>
              </View>

              <View style={styles.guidelineItem}>
                <Text style={styles.guidelineIcon}>🔒</Text>
                <View style={styles.guidelineContent}>
                  <Text style={styles.guidelineTitle}>Your Privacy</Text>
                  <Text style={styles.guidelineText}>
                    Your data is yours. We don't sell your information or show you ads.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  guidelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guidelineIcon: {
    fontSize: 32,
    marginRight: 16,
    alignSelf: 'flex-start',
  },
  guidelineContent: {
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  guidelineText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
});

export default AboutScreen;

