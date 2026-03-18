import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const slides = [
  {
    image: require('../assets/images/onboarding1.png'),
    title: 'Personalized For You!',
    description: 'Get recommendations based on\nyour taste.',
  },
  {
    image: require('../assets/images/onboarding2.png'),
    title: 'Listen Anywhere!',
    description: 'Enjoy audiobook and podcasts on\nthe go.',
  },
  {
    image: require('../assets/images/onboarding3.png'),
    title: 'Discover Amazing\nBooks',
    description: 'Access thousands of ebooks and\naudiobooks in one place.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const index = Math.round(x / width);
          setCurrentIndex(index);
        }}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <View style={styles.imageWrapper}>
              {/* Sparkle decorations */}
              <Text style={[styles.sparkle, styles.sparkleTopLeft]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleTopRight]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleBottomLeft]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleBottomRight]}>✦</Text>
              <View style={styles.yellowCircle}>
                <Image source={slide.image} style={styles.slideImage} resizeMode="contain" />
              </View>
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.activeDot]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Get Started  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  imageWrapper: {
    position: 'relative',
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  yellowCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFE600',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideImage: {
    width: 160,
    height: 160,
  },
  sparkle: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 18,
    opacity: 0.9,
  },
  sparkleTopLeft: {
    top: 10,
    left: 10,
    fontSize: 14,
  },
  sparkleTopRight: {
    top: 6,
    right: 14,
    fontSize: 20,
  },
  sparkleBottomLeft: {
    bottom: 18,
    left: 2,
    fontSize: 20,
  },
  sparkleBottomRight: {
    bottom: 8,
    right: 4,
    fontSize: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A3A',
  },
  activeDot: {
    backgroundColor: '#FF6B6B',
    width: 24,
    borderRadius: 4,
  },
  button: {
    width: '100%',
    backgroundColor: '#E05A5A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
