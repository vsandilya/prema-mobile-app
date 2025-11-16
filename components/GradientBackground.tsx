import React, { useEffect, useMemo } from 'react';
import { View, Dimensions, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

const { width: screenWidth } = Dimensions.get('window');

const HEARTS = [
  { left: screenWidth * 0.18, size: 24, delay: 0 },
  { left: screenWidth * 0.72, size: 32, delay: 800 },
  { left: screenWidth * 0.45, size: 20, delay: 1600 },
];

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
  const animatedValues = useMemo(
    () => HEARTS.map(() => new Animated.Value(0)),
    []
  );

  useEffect(() => {
    const loops = animatedValues.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -35,
            duration: 4200,
            delay: HEARTS[index].delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 4200,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [animatedValues]);

  return (
    <LinearGradient
      colors={['#7C3AED', '#EC4899', '#7C3AED']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.heartsContainer} pointerEvents="none">
        {HEARTS.map((heart, index) => (
          <Animated.Text
            key={`floating-heart-${index}`}
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
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  heartsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingHeart: {
    position: 'absolute',
    bottom: -40,
  },
});

export default GradientBackground;
