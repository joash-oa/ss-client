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
import { learnersApi } from '../../api/learners'
import { useAuthStore } from '../../store/useAuthStore'
import { colors, fonts } from '../../constants/theme'

type RegisterNav = NativeStackNavigationProp<AuthStackParams, 'Register'>

const AVATARS = ['🚀', '🦊', '🦁', '🌸', '⚡', '🌈', '🐯', '🦋', '🎯', '🌙', '🐧', '🦄']

const GRADES = [
  { label: 'K', gradeLevel: 0, age: 5 },
  { label: '1', gradeLevel: 1, age: 6 },
  { label: '2', gradeLevel: 2, age: 7 },
  { label: '3', gradeLevel: 3, age: 8 },
]

const STEP_TITLES = ['Create account', 'Set your PIN', 'Add your first learner']
const STEP_SUBTITLES = [
  "You're the parent — this is your account.",
  "You'll use this to access the Parent Dashboard.",
  'You can add more learners later.',
]
const TOTAL_STEPS = 3

export function RegisterScreen() {
  const { navigate } = useNavigation<RegisterNav>()
  const { setTokens, setActiveLearner } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [learnerName, setLearnerName] = useState('')
  const [selectedGradeIndex, setSelectedGradeIndex] = useState(0)
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])

  const contentAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    contentAnim.setValue(0)
    Animated.spring(contentAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }).start()
  }, [currentStep, contentAnim])

  function slideUp() {
    return {
      opacity: contentAnim,
      transform: [
        { translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      ],
    }
  }

  function handleStep1Next() {
    setErrorMessage('')
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.')
      return
    }
    setCurrentStep(2)
  }

  function handleStep2Next() {
    setErrorMessage('')
    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('PIN must be exactly 4 digits.')
      return
    }
    setCurrentStep(3)
  }

  async function handleStep3Submit() {
    setErrorMessage('')
    if (!learnerName.trim()) {
      setErrorMessage('Learner name is required.')
      return
    }
    setIsLoading(true)
    try {
      const authResponse = await authApi.register({ email: email.trim(), password, pin })
      await setTokens(authResponse.access_token, authResponse.refresh_token)
      const grade = GRADES[selectedGradeIndex]
      const learner = await learnersApi.create({
        name: learnerName.trim(),
        age: grade.age,
        grade_level: grade.gradeLevel,
        avatar_emoji: selectedAvatar,
      })
      setActiveLearner({ id: learner.id, name: learner.name, avatarEmoji: learner.avatar_emoji })
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleNextForCurrentStep() {
    if (currentStep === 1) handleStep1Next()
    else if (currentStep === 2) handleStep2Next()
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
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.backLabel}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepCounter}>{currentStep} of {TOTAL_STEPS}</Text>
          </View>

          <View style={styles.progressRow}>
            {Array.from({ length: TOTAL_STEPS }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  index < currentStep && styles.progressSegmentActive,
                ]}
              />
            ))}
          </View>

          <Animated.View style={[styles.stepContent, slideUp()]}>
            <Text style={styles.stepTitle}>{STEP_TITLES[currentStep - 1]}</Text>
            <Text style={styles.stepSubtitle}>{STEP_SUBTITLES[currentStep - 1]}</Text>

            {currentStep === 1 && (
              <View style={styles.fieldGroup}>
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
                    placeholder="Password (8+ characters)"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                  />
                </View>
              </View>
            )}

            {currentStep === 2 && (
              <View style={styles.fieldGroup}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>4-digit PIN</Text>
                  <TextInput
                    placeholder="PIN"
                    placeholderTextColor={colors.textMuted}
                    value={pin}
                    onChangeText={(text) => setPin(text.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                    style={[styles.input, styles.pinInput]}
                  />
                </View>
              </View>
            )}

            {currentStep === 3 && (
              <View style={styles.fieldGroup}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    placeholder="Learner's name"
                    placeholderTextColor={colors.textMuted}
                    value={learnerName}
                    onChangeText={setLearnerName}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Grade</Text>
                  <View style={styles.gradeRow}>
                    {GRADES.map((grade, index) => (
                      <TouchableOpacity
                        key={grade.label}
                        onPress={() => setSelectedGradeIndex(index)}
                        activeOpacity={0.8}
                        style={[
                          styles.gradeButton,
                          selectedGradeIndex === index && styles.gradeButtonActive,
                        ]}
                      >
                        <Text style={[
                          styles.gradeButtonText,
                          selectedGradeIndex === index && styles.gradeButtonTextActive,
                        ]}>
                          {grade.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Avatar</Text>
                  <View style={styles.avatarGrid}>
                    {AVATARS.map((avatar) => (
                      <TouchableOpacity
                        key={avatar}
                        onPress={() => setSelectedAvatar(avatar)}
                        activeOpacity={0.8}
                        style={[
                          styles.avatarButton,
                          selectedAvatar === avatar && styles.avatarButtonActive,
                        ]}
                      >
                        <Text style={styles.avatarEmoji}>{avatar}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {errorMessage ? (
              <View style={styles.errorBadge}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {currentStep < TOTAL_STEPS ? (
              <TouchableOpacity
                onPress={handleNextForCurrentStep}
                activeOpacity={0.85}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleStep3Submit}
                disabled={isLoading}
                activeOpacity={0.85}
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            )}

            {currentStep === 1 && (
              <TouchableOpacity
                onPress={() => navigate('Login')}
                activeOpacity={0.7}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  Already have an account?{' '}
                  <Text style={styles.secondaryButtonAccent}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            )}
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
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backLabel: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  stepCounter: {
    color: colors.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 36,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    flex: 1,
    gap: 20,
  },
  stepTitle: {
    fontSize: 36,
    fontFamily: fonts.black,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: -8,
  },
  fieldGroup: {
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
  pinInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gradeButton: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gradeButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  gradeButtonTextActive: {
    color: '#ffffff',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarButtonActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.primary}30`,
  },
  avatarEmoji: {
    fontSize: 26,
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
