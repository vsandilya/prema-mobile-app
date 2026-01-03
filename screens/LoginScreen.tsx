import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Dimensions,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import GradientBackground from '../components/GradientBackground';
import { useAuth } from '../contexts/AuthContext';
const LogoImage = require('../assets/images/prema-logo-2.png');

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HEARTS = [
  { left: screenWidth * 0.15, size: 26, delay: 0 },
  { left: screenWidth * 0.75, size: 30, delay: 800 },
  { left: screenWidth * 0.45, size: 20, delay: 1600 },
];

const ORBS = [
  { left: -120, top: -120, size: 240, color: 'rgba(255, 192, 203, 0.25)' },
  { right: -130, bottom: -130, size: 260, color: 'rgba(186, 85, 211, 0.25)' },
];

const FloatingHearts: React.FC = () => {
  const animatedValues = useMemo(
    () => HEARTS.map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    const loops = animatedValues.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -40,
            duration: 4000,
            delay: HEARTS[index].delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      )
    );

    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [animatedValues]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {HEARTS.map((heart, index) => (
        <Animated.Text
          key={`heart-${index}`}
          style={[
            styles.floatingHeart,
            {
              left: heart.left,
              fontSize: heart.size,
              transform: [{ translateY: animatedValues[index] }],
            },
          ]}
        >
          ❤️
        </Animated.Text>
      ))}
    </View>
  );
};

const FloatingOrbs: React.FC = () => {
  const animatedValues = useMemo(
    () => ORBS.map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    const loops = animatedValues.map(anim =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 5000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [animatedValues]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ORBS.map((orb, index) => {
        const scale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        });
        const opacity = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 0.55],
        });
        return (
          <Animated.View
            key={`orb-${index}`}
            style={[
              styles.floatingOrb,
              {
                backgroundColor: orb.color,
                width: orb.size,
                height: orb.size,
                left: orb.left,
                right: orb.right,
                top: orb.top,
                bottom: orb.bottom,
                transform: [{ scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSanskrit, setShowSanskrit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const sanskritOpacity = useRef(new Animated.Value(0)).current;
  const englishOpacity = useRef(new Animated.Value(1)).current;

  const { login } = useAuth();

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [cardAnim]);

  useEffect(() => {
    const interval = setInterval(() => setShowSanskrit(prev => !prev), 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(sanskritOpacity, {
        toValue: showSanskrit ? 1 : 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(englishOpacity, {
        toValue: showSanskrit ? 0 : 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showSanskrit, englishOpacity, sanskritOpacity]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };

  const inputFocusedStyle = (field: string) =>
    focusedField === field && styles.inputFocused;

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <FloatingHearts />
          <FloatingOrbs />

          <Animated.View style={[styles.cardWrapper, cardStyle]}>
            <Animated.View style={styles.logoContainer}>
              <Animated.View style={styles.logoInner}>
                <Image source={LogoImage} style={styles.logoImage} resizeMode="contain" />
              </Animated.View>
            </Animated.View>

            <View style={styles.titleContainer}>
              <Animated.Text style={[styles.appName, { opacity: englishOpacity }]}>
                Prema
              </Animated.Text>
              <Animated.Text style={[styles.appName, { opacity: sanskritOpacity }]}>
                प्रेम
              </Animated.Text>
            </View>

            <Animated.Text style={styles.tagline}>
              Love you seek is seeking you
            </Animated.Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="rgba(107,114,128,0.9)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, inputFocusedStyle('email')]}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="rgba(107,114,128,0.9)"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={[styles.input, styles.passwordInput, inputFocusedStyle('password')]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="rgba(107,114,128,0.9)"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleLogin}
                disabled={isLoading}
                style={[styles.primaryButton, isLoading && styles.disabledButton]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#4B5563" />
                ) : (
                  <Text style={styles.primaryButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Register')}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <Animated.View
              pointerEvents="none"
              style={[styles.pulseBubble, styles.pulseBubbleLeft]}
            />
            <Animated.View
              pointerEvents="none"
              style={[styles.pulseBubble, styles.pulseBubbleRight]}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoInner: {
    borderRadius: 28,
    overflow: 'hidden',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    position: 'absolute',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 18,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2933',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  inputFocused: {
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.4,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeButton: {
    position: 'absolute',
    right: 18,
    top: '50%',
    marginTop: -10,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  secondaryButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  floatingHeart: {
    position: 'absolute',
    bottom: -40,
  },
  floatingOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  pulseBubble: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pulseBubbleLeft: {
    top: -50,
    left: -60,
  },
  pulseBubbleRight: {
    bottom: -60,
    right: -70,
  },
});

export default LoginScreen;

