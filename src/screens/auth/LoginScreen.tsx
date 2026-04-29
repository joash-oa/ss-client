import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParams } from '../../navigation/AuthNavigator'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/useAuthStore'
import { colors, fonts } from '../../constants/theme'

type LoginNav = NativeStackNavigationProp<AuthStackParams, 'Login'>

export function LoginScreen() {
  const { navigate } = useNavigation<LoginNav>()
  const { setTokens } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const formAnim = useRef(new Animated.Value(0)).current
  const titleAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(titleAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.spring(formAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
    ]).start()
  }, [titleAnim, formAnim])

  function slideUp(anim: Animated.Value) {
    return {
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
      ],
    }
  }

  async function handleSignIn() {
    setErrorMessage('')
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.')
      return
    }
    setIsLoading(true)
    try {
      const response = await authApi.login({ email: email.trim(), password })
      await setTokens(response.access_token, response.refresh_token)
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.header, slideUp(titleAnim)]}>
            <Text style={styles.backLabel} onPress={() => navigate('Welcome')}>
              ← Back
            </Text>
            <Text style={styles.title}>Welcome{'\n'}back</Text>
            <Text style={styles.subtitle}>Access your parent account</Text>
          </Animated.View>

          <Animated.View style={[styles.form, slideUp(formAnim)]}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBadge}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              onPress={() => navigate('Register')}
              activeOpacity={0.7}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                Don't have an account?{' '}
                <Text style={styles.secondaryButtonAccent}>Get Started</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  backLabel: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 14,
    marginBottom: 28,
  },
  title: {
    fontSize: 44,
    fontFamily: fonts.black,
    color: colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 50,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 15,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBadge: {
    backgroundColor: `${colors.error}18`,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.error,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontFamily: fonts.black,
    fontSize: 17,
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  secondaryButtonAccent: {
    color: colors.accent,
  },
})
