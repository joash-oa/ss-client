import { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParams } from '../../navigation/AuthNavigator'
import { colors, fonts } from '../../constants/theme'

type WelcomeNav = NativeStackNavigationProp<AuthStackParams, 'Welcome'>

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const STAR_FIELD = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  top: Math.random() * SCREEN_HEIGHT,
  left: Math.random() * SCREEN_WIDTH,
  diameter: Math.random() * 2.5 + 0.8,
  opacity: Math.random() * 0.5 + 0.15,
}))

const SUBJECT_CHIPS = [
  { label: 'Math', borderColor: colors.primary, textColor: colors.primary },
  { label: 'Science', borderColor: colors.accent, textColor: colors.accent },
  { label: 'English', borderColor: colors.purple, textColor: colors.purple },
]

export function WelcomeScreen() {
  const { navigate } = useNavigation<WelcomeNav>()

  const mascotAnim = useRef(new Animated.Value(0)).current
  const titleAnim = useRef(new Animated.Value(0)).current
  const taglineAnim = useRef(new Animated.Value(0)).current
  const chipsAnim = useRef(new Animated.Value(0)).current
  const ctaAnim = useRef(new Animated.Value(0)).current
  const pulseScale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.stagger(110, [
      Animated.spring(mascotAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.spring(titleAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.spring(taglineAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.spring(chipsAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.spring(ctaAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start()
  }, [mascotAnim, titleAnim, taglineAnim, chipsAnim, ctaAnim, pulseScale])

  function slideUp(anim: Animated.Value) {
    return {
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
      ],
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STAR_FIELD.map((star) => (
          <View
            key={star.id}
            style={{
              position: 'absolute',
              top: star.top,
              left: star.left,
              width: star.diameter,
              height: star.diameter,
              borderRadius: star.diameter / 2,
              backgroundColor: '#ffffff',
              opacity: star.opacity,
            }}
          />
        ))}
      </View>

      <View style={styles.content}>
        <View style={styles.topGroup}>
          <Animated.View style={[styles.mascotWrapper, slideUp(mascotAnim)]}>
            <View style={styles.glowRing} />
            <Animated.Text
              style={[styles.mascotEmoji, { transform: [{ scale: pulseScale }] }]}
            >
              🚀
            </Animated.Text>
          </Animated.View>

          <Animated.Text style={[styles.appName, slideUp(titleAnim)]}>
            Smarty Steps
          </Animated.Text>

          <Animated.View style={[styles.chipsRow, slideUp(taglineAnim)]}>
            {SUBJECT_CHIPS.map(({ label, borderColor, textColor }) => (
              <View key={label} style={[styles.chip, { borderColor }]}>
                <Text style={[styles.chipLabel, { color: textColor }]}>{label}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        <Animated.View style={[styles.bottomGroup, slideUp(chipsAnim)]}>
          <Animated.Text style={[styles.tagline, slideUp(chipsAnim)]}>
            Your adventure starts here! 🌟
          </Animated.Text>

          <Animated.View style={[styles.ctaGroup, slideUp(ctaAnim)]}>
            <TouchableOpacity
              onPress={() => navigate('Register')}
              activeOpacity={0.85}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigate('Login')}
              activeOpacity={0.7}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  topGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomGroup: {
    width: '100%',
    alignItems: 'center',
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  mascotEmoji: {
    fontSize: 82,
  },
  appName: {
    fontSize: 44,
    fontFamily: fonts.black,
    color: colors.textPrimary,
    letterSpacing: -1.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 28,
    opacity: 0.9,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 60,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  chipLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  ctaGroup: {
    width: '100%',
    gap: 6,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: fonts.black,
    fontSize: 17,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
})
