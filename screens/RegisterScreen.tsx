import React, { useState } from 'react';
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
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import { useAuth } from '../contexts/AuthContext';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    bio: '',
    gender: '',
    seeking_gender: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [bioError, setBioError] = useState<string>('');
  const { register } = useAuth();

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  const seekingGenderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Everyone", value: "both" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field === 'bio' && bioError) {
      setBioError('');
    }
  };

  const validateForm = () => {
    if (!formData.email.trim() || !formData.password.trim() || !formData.name.trim() || 
        !formData.age.trim() || !formData.gender.trim() || !formData.seeking_gender.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18) {
      Alert.alert('Error', 'You must be at least 18 years old');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!termsAgreed) {
      Alert.alert('Error', 'You must agree to the Terms of Service and Community Guidelines to continue');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const registerData = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        age: parseInt(formData.age),
        bio: formData.bio.trim() || undefined,
        gender: formData.gender,
        seeking_gender: formData.seeking_gender,
        terms_agreed: termsAgreed,
      };

      await register(registerData);
      // Navigation will be handled by the auth state change
    } catch (error: any) {
      // Check if it's a content filter error
      if (error.message && error.message.includes('inappropriate language')) {
        setBioError(error.message);
      } else {
        Alert.alert('Registration Failed', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our dating community</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Confirm your password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    bioError && styles.inputError
                  ]}
                  value={formData.bio}
                  onChangeText={(value) => handleInputChange('bio', value)}
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {bioError ? (
                  <Text style={styles.errorText}>{bioError}</Text>
                ) : null}
              </View>

              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setTermsAgreed(!termsAgreed)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, termsAgreed && styles.checkboxChecked]}>
                    {termsAgreed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text
                      style={styles.termsLink}
                      onPress={() => navigation.navigate('Terms')}
                    >
                      Terms of Service and Community Guidelines
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, (isLoading || !termsAgreed) && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading || !termsAgreed}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
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
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  termsContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default RegisterScreen;
