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

interface TermsScreenProps {
  navigation: any;
}

const TermsScreen: React.FC<TermsScreenProps> = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <Text style={styles.introText}>
              By using Prema, you agree to the following terms and conditions. Please read them carefully.
            </Text>

            {/* Age Requirement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Age Requirement</Text>
              <Text style={styles.sectionText}>
                You must be at least 18 years old to use Prema. By creating an account, you represent and warrant that you are 18 years of age or older. We reserve the right to verify your age and suspend or terminate accounts that violate this requirement.
              </Text>
            </View>

            {/* Content Guidelines */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. User-Generated Content Guidelines</Text>
              <Text style={styles.sectionText}>
                You are responsible for all content you post, including photos, profile information, and messages. You agree not to post:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletPoint}>• Objectionable, offensive, or inappropriate content</Text>
                <Text style={styles.bulletPoint}>• Nudity, explicit sexual content, or pornographic material</Text>
                <Text style={styles.bulletPoint}>• Content that promotes violence, hate speech, or discrimination</Text>
                <Text style={styles.bulletPoint}>• False, misleading, or fraudulent information</Text>
                <Text style={styles.bulletPoint}>• Content that infringes on intellectual property rights</Text>
                <Text style={styles.bulletPoint}>• Spam, solicitation, or commercial content</Text>
              </View>
            </View>

            {/* No Harassment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. No Harassment or Abusive Behavior</Text>
              <Text style={styles.sectionText}>
                Prema has a zero-tolerance policy for harassment, abuse, or threatening behavior. This includes but is not limited to:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletPoint}>• Sending unwanted, offensive, or inappropriate messages</Text>
                <Text style={styles.bulletPoint}>• Harassing, stalking, or threatening other users</Text>
                <Text style={styles.bulletPoint}>• Impersonating another person or entity</Text>
                <Text style={styles.bulletPoint}>• Bullying, intimidation, or any form of abuse</Text>
                <Text style={styles.bulletPoint}>• Sharing private information without consent</Text>
              </View>
              <Text style={styles.sectionText}>
                Any user found engaging in such behavior will have their account immediately removed.
              </Text>
            </View>

            {/* Account Removal */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Account Removal</Text>
              <Text style={styles.sectionText}>
                We reserve the right to suspend or permanently remove accounts that violate these Terms of Service or our Community Guidelines. Violations include but are not limited to:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletPoint}>• Posting objectionable or inappropriate content</Text>
                <Text style={styles.bulletPoint}>• Engaging in harassment or abusive behavior</Text>
                <Text style={styles.bulletPoint}>• Being under 18 years of age</Text>
                <Text style={styles.bulletPoint}>• Violating any applicable laws or regulations</Text>
                <Text style={styles.bulletPoint}>• Creating multiple accounts or using fake identities</Text>
              </View>
              <Text style={styles.sectionText}>
                Account removal is at our sole discretion and may occur without prior notice. We are not obligated to provide a reason for account removal.
              </Text>
            </View>

            {/* Community Guidelines */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Community Guidelines</Text>
              <Text style={styles.sectionText}>
                In addition to these Terms of Service, all users must follow our Community Guidelines:
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bulletPoint}>• Be Real: Use authentic photos and honest profile information</Text>
                <Text style={styles.bulletPoint}>• Be Kind: Treat all users with respect and dignity</Text>
                <Text style={styles.bulletPoint}>• Be Safe: Exercise caution when meeting people in person</Text>
              </View>
            </View>

            {/* Reporting */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Reporting Violations</Text>
              <Text style={styles.sectionText}>
                If you encounter content or behavior that violates these terms, please report it immediately through the app. We take all reports seriously and will investigate promptly.
              </Text>
            </View>

            {/* Acceptance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Acceptance of Terms</Text>
              <Text style={styles.sectionText}>
                By checking the "I agree to the Terms of Service and Community Guidelines" box during registration, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Community Guidelines.
              </Text>
            </View>

            {/* Last Updated */}
            <View style={styles.section}>
              <Text style={styles.lastUpdated}>
                Last Updated: December 19, 2024
              </Text>
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
  introText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletList: {
    marginLeft: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 6,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TermsScreen;

