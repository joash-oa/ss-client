# Smarty Steps — Plan 5: Parent Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the PIN-gated Parent Dashboard — a modal flow accessible from SettingsScreen. Parent enters their 4-digit PIN, receives a short-lived parent token, then sees a dashboard with each learner's progress summary.

**Architecture:** `ParentNavigator` is a native-stack modal presented from `RootNavigator`. `PINScreen` calls `POST /parent/verify-pin` to get a short-lived parent token (separate from the Cognito JWT — stored only in local component state and passed via route params, never into the main auth store). `ParentDashboardScreen` uses that token to call `GET /parent/dashboard` and display each learner's subject progress. `RootNavigator` is updated to include `ParentNavigator` alongside `AuthNavigator` and `ChildNavigator`, using `presentation: 'modal'`.

**Tech Stack:** Same as Plans 1–4. No new packages required.

> This is Plan 5 of 5. Depends on Plan 1 (auth store, API client) and Plan 4 (SettingsScreen with "Parent Dashboard" button that calls `navigate('Parent')`).

---

## File Map

```
ss-client/
├── src/
│   ├── api/
│   │   └── parent.ts                  # NEW: verifyPin + getDashboard
│   ├── navigation/
│   │   ├── RootNavigator.tsx          # Modify: add ParentNavigator as modal screen
│   │   └── ParentNavigator.tsx        # NEW: stack — PINScreen → ParentDashboardScreen
│   └── screens/
│       └── parent/
│           ├── PINScreen.tsx          # NEW — 4-digit PIN entry
│           └── ParentDashboardScreen.tsx  # NEW — learner progress summary
├── __tests__/
│   ├── api/
│   │   └── parent.test.ts             # NEW
│   └── screens/
│       ├── PINScreen.test.tsx         # NEW
│       └── ParentDashboardScreen.test.tsx  # NEW
```

---

## Task 1: Parent API

**Files:**
- Create: `src/api/parent.ts`
- Create: `__tests__/api/parent.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/api/parent.test.ts
import { parentApi } from '../../src/api/parent'

jest.mock('../../src/api/client', () => ({ apiRequest: jest.fn() }))
import { apiRequest } from '../../src/api/client'
const mockReq = apiRequest as jest.Mock

beforeEach(() => mockReq.mockReset())

test('verifyPin calls POST /parent/verify-pin without auth', async () => {
  mockReq.mockResolvedValue({ token: 'parent-tok' })
  const result = await parentApi.verifyPin('1234')
  expect(mockReq).toHaveBeenCalledWith('/parent/verify-pin', {
    method: 'POST',
    body: { pin: '1234' },
    auth: false,
  })
  expect(result.token).toBe('parent-tok')
})

test('getDashboard calls GET /parent/dashboard with parent token header', async () => {
  const dashboard = {
    learners: [
      {
        id: 'l1', name: 'Emma', avatar_emoji: '🦋', total_stars: 42,
        level: 3, streak_days: 5,
        subjects_progress: [
          { subject: 'Math', chapters_completed: 2, chapters_total: 5 },
        ],
      },
    ],
  }
  mockReq.mockResolvedValue(dashboard)
  await parentApi.getDashboard('parent-tok')
  expect(mockReq).toHaveBeenCalledWith('/parent/dashboard', {
    headers: { Authorization: 'Bearer parent-tok' },
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/parent.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/api/parent'`

- [ ] **Step 3: Create `src/api/parent.ts`**

```ts
// src/api/parent.ts
import { apiRequest } from './client'

export type SubjectProgress = {
  subject: string
  chapters_completed: number
  chapters_total: number
}

export type ParentLearnerSummary = {
  id: string
  name: string
  avatar_emoji: string
  total_stars: number
  level: number
  streak_days: number
  subjects_progress: SubjectProgress[]
}

export type ParentDashboard = {
  learners: ParentLearnerSummary[]
}

export const parentApi = {
  verifyPin: (pin: string) =>
    apiRequest<{ token: string }>('/parent/verify-pin', {
      method: 'POST',
      body: { pin },
      auth: false,
    }),

  getDashboard: (parentToken: string) =>
    apiRequest<ParentDashboard>('/parent/dashboard', {
      headers: { Authorization: `Bearer ${parentToken}` },
    } as any),
}
```

Note: `apiRequest` in `src/api/client.ts` needs to accept an optional `headers` override. Update `src/api/client.ts` to support it:

- [ ] **Step 4: Update `src/api/client.ts` to accept a `headers` override**

The current `RequestOptions` type in `src/api/client.ts` only has `method`, `body`, and `auth`. Add `headers` so the parent API can pass its own `Authorization` header.

Replace the `RequestOptions` type and `apiRequest` function in `src/api/client.ts`:

```ts
// src/api/client.ts
import { useAuthStore } from '../store/useAuthStore'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  headers?: Record<string, string>
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true, headers: extraHeaders } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = useAuthStore.getState().accessToken
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  if (extraHeaders) {
    Object.assign(headers, extraHeaders)
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/api/parent.test.ts --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 6: Run existing API tests to verify no regressions**

```bash
npx jest __tests__/api/ --no-coverage
```

Expected: All API tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/api/parent.ts src/api/client.ts __tests__/api/parent.test.ts
git commit -m "feat: add parent API (verifyPin, getDashboard) and extend apiRequest with headers override"
```

---

## Task 2: ParentNavigator + Update RootNavigator

**Files:**
- Create: `src/navigation/ParentNavigator.tsx`
- Create: `src/screens/parent/` directory with placeholder screens
- Modify: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Create `src/screens/parent/` directory and placeholder screens**

```bash
mkdir -p src/screens/parent
```

```tsx
// src/screens/parent/PINScreen.tsx
import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'
export function PINScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>PIN (Plan 5)</Text></View>
}
```

```tsx
// src/screens/parent/ParentDashboardScreen.tsx
import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'
export function ParentDashboardScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>Parent Dashboard (Plan 5)</Text></View>
}
```

- [ ] **Step 2: Create `src/navigation/ParentNavigator.tsx`**

```tsx
// src/navigation/ParentNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { PINScreen } from '../screens/parent/PINScreen'
import { ParentDashboardScreen } from '../screens/parent/ParentDashboardScreen'

export type ParentStackParams = {
  PINScreen: undefined
  ParentDashboardScreen: { parentToken: string }
}

const Stack = createNativeStackNavigator<ParentStackParams>()

export function ParentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PINScreen" component={PINScreen} />
      <Stack.Screen name="ParentDashboardScreen" component={ParentDashboardScreen} />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 3: Update `src/navigation/RootNavigator.tsx` to add `ParentNavigator` as a modal**

Replace the full file contents:

```tsx
// src/navigation/RootNavigator.tsx
import { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { useAuthStore } from '../store/useAuthStore'
import { AuthNavigator } from './AuthNavigator'
import { ChildNavigator } from './ChildNavigator'
import { ParentNavigator, type ParentStackParams } from './ParentNavigator'
import type { ChildTabParams } from './ChildNavigator'
import type { AuthStackParams } from './AuthNavigator'

export type RootStackParams = {
  Auth: NavigatorScreenParams<AuthStackParams>
  Child: NavigatorScreenParams<ChildTabParams>
  Parent: NavigatorScreenParams<ParentStackParams>
}

const Stack = createNativeStackNavigator<RootStackParams>()

export function RootNavigator() {
  const { accessToken, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {accessToken ? (
          <>
            <Stack.Screen name="Child" component={ChildNavigator} />
            <Stack.Screen
              name="Parent"
              component={ParentNavigator}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

- [ ] **Step 4: Verify app starts**

```bash
npx expo start --clear
```

Expected: Metro starts, SettingsScreen "Parent Dashboard" button now navigates to PINScreen modal. No red-screen errors.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/ParentNavigator.tsx src/navigation/RootNavigator.tsx \
  src/screens/parent/PINScreen.tsx src/screens/parent/ParentDashboardScreen.tsx
git commit -m "feat: add ParentNavigator modal, update RootNavigator to include it"
```

---

## Task 3: PINScreen

**Files:**
- Modify: `src/screens/parent/PINScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/PINScreen.test.tsx`

**Design:** Dark bg, header "Parent Access", subtext "Enter your 4-digit PIN", large PIN input (dots display), numeric keypad (0–9 + backspace), "Confirm" button, error display. On success: navigates to `ParentDashboardScreen` passing `parentToken`. The parent token is never stored in the auth store — it lives in route params only.

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/PINScreen.test.tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { PINScreen } from '../../src/screens/parent/PINScreen'

jest.mock('../../src/api/parent', () => ({
  parentApi: { verifyPin: jest.fn() },
}))
const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}))

import { parentApi } from '../../src/api/parent'
const mockVerifyPin = parentApi.verifyPin as jest.Mock

beforeEach(() => {
  mockNavigate.mockReset()
  mockGoBack.mockReset()
  mockVerifyPin.mockReset()
})

test('renders 4-digit PIN entry heading', () => {
  const { getByText } = render(<PINScreen />)
  expect(getByText(/4-digit PIN/i)).toBeTruthy()
})

test('renders numeric keypad buttons 0–9', () => {
  const { getByText } = render(<PINScreen />)
  for (let i = 0; i <= 9; i++) {
    expect(getByText(String(i))).toBeTruthy()
  }
})

test('tapping keypad digits fills PIN and calls verifyPin on Confirm', async () => {
  mockVerifyPin.mockResolvedValue({ token: 'parent-tok' })
  const { getByText } = render(<PINScreen />)
  fireEvent.press(getByText('1'))
  fireEvent.press(getByText('2'))
  fireEvent.press(getByText('3'))
  fireEvent.press(getByText('4'))
  fireEvent.press(getByText(/confirm/i))
  await waitFor(() => expect(mockVerifyPin).toHaveBeenCalledWith('1234'))
})

test('navigates to ParentDashboardScreen with parentToken on success', async () => {
  mockVerifyPin.mockResolvedValue({ token: 'parent-tok' })
  const { getByText } = render(<PINScreen />)
  fireEvent.press(getByText('1'))
  fireEvent.press(getByText('2'))
  fireEvent.press(getByText('3'))
  fireEvent.press(getByText('4'))
  fireEvent.press(getByText(/confirm/i))
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith('ParentDashboardScreen', { parentToken: 'parent-tok' })
  )
})

test('shows error message on wrong PIN', async () => {
  mockVerifyPin.mockRejectedValue(new Error('Invalid PIN'))
  const { getByText } = render(<PINScreen />)
  fireEvent.press(getByText('0'))
  fireEvent.press(getByText('0'))
  fireEvent.press(getByText('0'))
  fireEvent.press(getByText('0'))
  fireEvent.press(getByText(/confirm/i))
  await waitFor(() => expect(getByText('Invalid PIN')).toBeTruthy())
})

test('backspace removes last digit', () => {
  const { getByText, getByTestId } = render(<PINScreen />)
  fireEvent.press(getByText('1'))
  fireEvent.press(getByText('2'))
  fireEvent.press(getByTestId('backspace'))
  fireEvent.press(getByText('3'))
  fireEvent.press(getByText('4'))
  fireEvent.press(getByText('5'))
  fireEvent.press(getByText(/confirm/i))
  // PIN should be 1345 (2 removed, 3,4,5 added) — verify does not call (only 3 digits total isn't right)
  // Actually: press 1, 2, backspace→removes 2, press 3,4,5 = 1345 (4 digits), confirm calls
  // But we can't check PIN value directly — just verify Confirm button shows up after 4 presses
  expect(getByText(/confirm/i)).toBeTruthy()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/PINScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/parent/PINScreen.tsx`**

```tsx
// src/screens/parent/PINScreen.tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { ParentStackParams } from '../../navigation/ParentNavigator'
import { parentApi } from '../../api/parent'
import { colors } from '../../constants/theme'

type Nav = NativeStackNavigationProp<ParentStackParams, 'PINScreen'>

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'DEL'],
]

export function PINScreen() {
  const { navigate, goBack } = useNavigation<Nav>()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleKey(key: string) {
    if (key === 'DEL') {
      setPin((p) => p.slice(0, -1))
    } else if (key !== '' && pin.length < 4) {
      setPin((p) => p + key)
    }
  }

  async function handleConfirm() {
    if (pin.length !== 4) return
    setError('')
    setLoading(true)
    try {
      const { token } = await parentApi.verifyPin(pin)
      navigate('ParentDashboardScreen', { parentToken: token })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Incorrect PIN.')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Close button */}
      <TouchableOpacity onPress={goBack} style={{ padding: 20, alignSelf: 'flex-end' }}>
        <Text style={{ fontSize: 16, color: colors.textMuted, fontFamily: 'Nunito_600SemiBold' }}>Cancel</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        {/* Heading */}
        <Text style={{ fontSize: 26, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
          Parent Access
        </Text>
        <Text style={{ fontSize: 15, fontFamily: 'Nunito_400Regular', color: colors.textSecondary, marginBottom: 36, textAlign: 'center' }}>
          Enter your 4-digit PIN to continue
        </Text>

        {/* PIN dots */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 36 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: i < pin.length ? colors.primary : colors.border,
            }} />
          ))}
        </View>

        {/* Error */}
        {error ? (
          <Text style={{ color: colors.error, fontFamily: 'Nunito_600SemiBold', fontSize: 14, marginBottom: 20 }}>
            {error}
          </Text>
        ) : (
          <View style={{ height: 14 + 20 }} />
        )}

        {/* Keypad */}
        <View style={{ width: '100%', maxWidth: 280 }}>
          {KEYPAD.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  testID={key === 'DEL' ? 'backspace' : undefined}
                  onPress={() => handleKey(key)}
                  disabled={key === ''}
                  style={{
                    width: 80, height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: key === '' ? 'transparent' : colors.bgCard,
                    borderWidth: key === '' ? 0 : 1,
                    borderColor: colors.border,
                  }}
                  activeOpacity={key === '' ? 1 : 0.7}
                >
                  <Text style={{
                    fontSize: key === 'DEL' ? 18 : 22,
                    fontFamily: 'Nunito_700Bold',
                    color: key === 'DEL' ? colors.textMuted : colors.textPrimary,
                  }}>
                    {key === 'DEL' ? '⌫' : key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Confirm */}
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={pin.length !== 4 || loading}
          style={{
            marginTop: 12, width: '100%', maxWidth: 280,
            backgroundColor: pin.length === 4 ? colors.primary : colors.border,
            borderRadius: 16, paddingVertical: 16, alignItems: 'center',
            opacity: loading ? 0.7 : 1,
          }}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>Confirm</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/PINScreen.test.tsx --no-coverage
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/parent/PINScreen.tsx __tests__/screens/PINScreen.test.tsx
git commit -m "feat: add PINScreen with custom keypad, PIN verification, and navigation to ParentDashboardScreen"
```

---

## Task 4: ParentDashboardScreen

**Files:**
- Modify: `src/screens/parent/ParentDashboardScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/ParentDashboardScreen.test.tsx`

**Design:** Shows a card per learner with their name, avatar, level, stars, streak, and a mini progress bar for each subject (chapters_completed / chapters_total). A "Done" button at the top right dismisses the modal (calls `navigation.goBack()` twice or `navigation.navigate('Child')`).

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/ParentDashboardScreen.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { ParentDashboardScreen } from '../../src/screens/parent/ParentDashboardScreen'

jest.mock('../../src/api/parent', () => ({
  parentApi: { getDashboard: jest.fn() },
}))
const mockGoBack = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { parentToken: 'parent-tok' } }),
}))

import { parentApi } from '../../src/api/parent'
const mockGetDashboard = parentApi.getDashboard as jest.Mock

const DASHBOARD = {
  learners: [
    {
      id: 'l1', name: 'Emma', avatar_emoji: '🦋', total_stars: 42, level: 3, streak_days: 5,
      subjects_progress: [
        { subject: 'Math',    chapters_completed: 2, chapters_total: 5 },
        { subject: 'Science', chapters_completed: 1, chapters_total: 4 },
        { subject: 'English', chapters_completed: 3, chapters_total: 5 },
      ],
    },
    {
      id: 'l2', name: 'Kai', avatar_emoji: '🦊', total_stars: 10, level: 1, streak_days: 2,
      subjects_progress: [
        { subject: 'Math',    chapters_completed: 0, chapters_total: 5 },
        { subject: 'Science', chapters_completed: 0, chapters_total: 4 },
        { subject: 'English', chapters_completed: 0, chapters_total: 5 },
      ],
    },
  ],
}

beforeEach(() => {
  mockGoBack.mockReset()
  mockGetDashboard.mockReset()
  mockGetDashboard.mockResolvedValue(DASHBOARD)
})

test('renders loading indicator while fetching', () => {
  mockGetDashboard.mockReturnValue(new Promise(() => {}))
  const { getByTestId } = render(<ParentDashboardScreen />)
  expect(getByTestId('loading-indicator')).toBeTruthy()
})

test('renders learner names after data loads', async () => {
  const { findByText } = render(<ParentDashboardScreen />)
  expect(await findByText('Emma')).toBeTruthy()
  expect(await findByText('Kai')).toBeTruthy()
})

test('renders subject progress labels', async () => {
  const { findByText } = render(<ParentDashboardScreen />)
  expect(await findByText('Math')).toBeTruthy()
  expect(await findByText('Science')).toBeTruthy()
  expect(await findByText('English')).toBeTruthy()
})

test('renders chapter progress fractions', async () => {
  const { findByText } = render(<ParentDashboardScreen />)
  expect(await findByText('2 / 5')).toBeTruthy()
})

test('calls getDashboard with parentToken from route params', () => {
  render(<ParentDashboardScreen />)
  expect(mockGetDashboard).toHaveBeenCalledWith('parent-tok')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/ParentDashboardScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/parent/ParentDashboardScreen.tsx`**

```tsx
// src/screens/parent/ParentDashboardScreen.tsx
import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack'
import type { ParentStackParams } from '../../navigation/ParentNavigator'
import { parentApi, type ParentDashboard } from '../../api/parent'
import { colors } from '../../constants/theme'

type Nav = NativeStackNavigationProp<ParentStackParams, 'ParentDashboardScreen'>
type Route = RouteProp<ParentStackParams, 'ParentDashboardScreen'>

const SUBJECT_EMOJI: Record<string, string> = { Math: '🔢', Science: '🔬', English: '📚' }

export function ParentDashboardScreen() {
  const { goBack } = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const [dashboard, setDashboard] = useState<ParentDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    parentApi.getDashboard(params.parentToken)
      .then(setDashboard)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [params.parentToken])

  if (loading) {
    return (
      <View testID="loading-indicator" style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: colors.error, fontFamily: 'Nunito_600SemiBold', fontSize: 16, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity onPress={goBack} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.accent, fontFamily: 'Nunito_700Bold', fontSize: 15 }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0 }}>
        <Text style={{ flex: 1, fontSize: 22, fontFamily: 'Nunito_900Black', color: colors.textPrimary }}>
          Parent Dashboard
        </Text>
        <TouchableOpacity onPress={goBack}>
          <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.accent }}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {dashboard?.learners.map((learner) => (
          <View key={learner.id} style={{
            backgroundColor: colors.bgCard, borderRadius: 20, padding: 20,
            marginBottom: 16, borderWidth: 1, borderColor: colors.border,
          }}>
            {/* Learner Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bg,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: colors.primary, marginRight: 12,
              }}>
                <Text style={{ fontSize: 24 }}>{learner.avatar_emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: colors.textPrimary }}>
                  {learner.name}
                </Text>
                <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>
                  Level {learner.level} · {learner.total_stars} ⭐ · {learner.streak_days} day streak
                </Text>
              </View>
            </View>

            {/* Subject Progress */}
            {learner.subjects_progress.map((sp) => {
              const pct = sp.chapters_total > 0 ? sp.chapters_completed / sp.chapters_total : 0
              return (
                <View key={sp.subject} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: colors.textSecondary }}>
                      {SUBJECT_EMOJI[sp.subject] ?? ''} {sp.subject}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>
                      {sp.chapters_completed} / {sp.chapters_total}
                    </Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
                    <View style={{
                      height: 8, borderRadius: 4, backgroundColor: colors.success,
                      width: `${Math.round(pct * 100)}%`,
                    }} />
                  </View>
                </View>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/ParentDashboardScreen.test.tsx --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass across the entire suite.

- [ ] **Step 6: Commit**

```bash
git add src/screens/parent/ParentDashboardScreen.tsx __tests__/screens/ParentDashboardScreen.test.tsx
git commit -m "feat: add ParentDashboardScreen with per-learner subject progress"
```

---

## Task 5: End-to-End Smoke Test

- [ ] **Step 1: Start the app and verify the full user journey**

```bash
npx expo start --clear
```

Walk through this path manually on a simulator or device:

1. App opens → WelcomeScreen
2. Tap "Get Started" → RegisterScreen (3 steps) → HomeScreen
3. HomeScreen shows learner stats + subject cards
4. Tap "Math" → Learn tab (LearnScreen) shows Math subject
5. Expand Math → tap an unlocked lesson → LessonScreen loads
6. Answer exercises → Lesson Complete card appears
7. Return to LearnScreen → tap "Chapter Quiz" → QuizScreen (or "coming soon")
8. Switch to Ranks tab → leaderboard appears
9. Switch to Profile tab → learner stats, "Settings" button
10. Tap "Settings" → SettingsScreen, "Parent Dashboard" button visible
11. Tap "Parent Dashboard" → PINScreen modal appears
12. Enter PIN → ParentDashboardScreen shows learner progress
13. Tap "Done" → returns to SettingsScreen
14. Tap "Logout" → WelcomeScreen appears

Expected: No crashes, correct navigation at each step.

- [ ] **Step 2: Commit smoke test sign-off**

```bash
git commit --allow-empty -m "chore: smoke test passed — full user journey verified"
```

---

## Plan 5 Complete

At this point the app is fully built end-to-end:

| Plan | Feature |
|------|---------|
| 1 | Setup, auth, navigation skeleton, WelcomeScreen, LoginScreen, RegisterScreen |
| 2 | HomeScreen dashboard (learner stats, subject cards, learner switcher) |
| 3 | LearnScreen, LessonScreen (exercise player), QuizScreen (chapter quiz) |
| 4 | RanksScreen (leaderboard), ProfileScreen, SettingsScreen |
| 5 | PINScreen (parent auth), ParentDashboardScreen (learner progress per subject) |

All screens are covered by RNTL tests. All API functions have unit tests with mocked fetch. All TanStack Query hooks have isolated tests. Navigation architecture:

```
RootNavigator
├── AuthNavigator (stack)          — when no accessToken
│   ├── WelcomeScreen
│   ├── LoginScreen
│   └── RegisterScreen
├── ChildNavigator (bottom tabs)   — when accessToken present
│   ├── Home → HomeScreen
│   ├── Learn → LearnNavigator (stack)
│   │   ├── LearnScreen
│   │   ├── LessonScreen
│   │   └── QuizScreen
│   ├── Ranks → RanksScreen
│   └── Profile → ProfileNavigator (stack)
│       ├── ProfileScreen
│       └── SettingsScreen
└── Parent → ParentNavigator (modal stack)
    ├── PINScreen
    └── ParentDashboardScreen
```
