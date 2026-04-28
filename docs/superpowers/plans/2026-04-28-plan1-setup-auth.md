# Smarty Steps — Plan 1: Project Setup + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Expo React Native project with navigation skeleton, design tokens, and fully working auth screens (Welcome, Login, multi-step Register with first-learner onboarding).

**Architecture:** Nested React Navigation navigators. A Zustand auth store backed by Expo SecureStore persists tokens across restarts. `RootNavigator` reads `accessToken` from the store and switches between `AuthNavigator` and `ChildNavigator`. Auth API calls go through a typed `apiRequest` helper that injects Bearer tokens automatically.

**Tech Stack:** Expo SDK 52, React Native, React Navigation 6 (native-stack + bottom-tabs), NativeWind 4, Zustand 5, TanStack Query 5, Expo SecureStore, @expo-google-fonts/nunito, Jest + React Native Testing Library

> This is Plan 1 of 5. Plans 2–5 cover Dashboard, Learn+Lesson, Ranks+Profile+Settings, and Parent Dashboard respectively.

---

## File Map

```
ss-client/
├── .env                                     # EXPO_PUBLIC_API_URL
├── app.json
├── babel.config.js                          # NativeWind plugin
├── tailwind.config.js                       # color tokens
├── src/
│   ├── constants/
│   │   └── theme.ts                         # colors, fonts, radius
│   ├── store/
│   │   └── useAuthStore.ts                  # Zustand: tokens, activeLearner, hydrate
│   ├── api/
│   │   ├── client.ts                        # fetch wrapper, auth header injection
│   │   ├── auth.ts                          # register / login / refresh
│   │   └── learners.ts                      # list / create (needed for Register step 3)
│   ├── navigation/
│   │   ├── RootNavigator.tsx                # switches Auth ↔ Child based on token
│   │   ├── AuthNavigator.tsx                # Welcome → Login → Register stack
│   │   └── ChildNavigator.tsx               # bottom tabs (placeholder screens for now)
│   └── screens/
│       └── auth/
│           ├── WelcomeScreen.tsx
│           ├── LoginScreen.tsx
│           └── RegisterScreen.tsx           # 3-step: creds → PIN → first learner
├── __tests__/
│   ├── store/
│   │   └── useAuthStore.test.ts
│   ├── api/
│   │   └── auth.test.ts
│   └── screens/
│       ├── WelcomeScreen.test.tsx
│       ├── LoginScreen.test.tsx
│       └── RegisterScreen.test.tsx
```

---

## Task 1: Initialize Expo Project

**Files:**
- Create: `package.json`, `app.json`, `babel.config.js`, `tailwind.config.js`, `.env`, `src/` directory tree

- [ ] **Step 1: Create the Expo project**

```bash
cd "/Users/jowusuansah/Dev/smarty steps"
npx create-expo-app ss-client --template blank-typescript
cd ss-client
```

- [ ] **Step 2: Install all dependencies**

```bash
npx expo install expo-secure-store @expo-google-fonts/nunito expo-font
npx expo install react-native-safe-area-context react-native-screens
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install zustand @tanstack/react-query
npm install nativewind
npm install --save-dev tailwindcss@3.3.2 jest @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 3: Configure NativeWind — update `babel.config.js`**

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

- [ ] **Step 4: Create `tailwind.config.js`**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:           '#0f0f1a',
        'bg-card':    '#1a1a2e',
        primary:      '#4361EE',
        'primary-lt': '#6d87f5',
        accent:       '#4CC9F0',
        purple:       '#7209B7',
        star:         '#FFD166',
        success:      '#06D6A0',
        error:        '#EF233C',
        't-primary':  '#FFFFFF',
        't-secondary':'#a0a0c8',
        't-muted':    '#5a5a8a',
        border:       '#2d2d44',
      },
      fontFamily: {
        sans:      ['Nunito_400Regular'],
        semibold:  ['Nunito_600SemiBold'],
        bold:      ['Nunito_700Bold'],
        extrabold: ['Nunito_800ExtraBold'],
        black:     ['Nunito_900Black'],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 5: Create `.env`**

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

- [ ] **Step 6: Create `src/` directory structure**

```bash
mkdir -p src/constants src/store src/api src/navigation src/screens/auth
mkdir -p __tests__/store __tests__/api __tests__/screens
```

- [ ] **Step 7: Configure Jest in `package.json`**

Add under the top-level `"jest"` key (merge with existing if present):

```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
  ]
}
```

- [ ] **Step 8: Verify project starts**

```bash
npx expo start --clear
```

Expected: Metro bundler starts, QR code displayed. Press `Ctrl+C` to stop.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: initialize Expo project with dependencies and NativeWind"
```

---

## Task 2: Theme Constants

**Files:**
- Create: `src/constants/theme.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/store/theme.test.ts
import { colors, fonts, radius } from '../../src/constants/theme'

test('colors has required keys', () => {
  expect(colors.bg).toBe('#0f0f1a')
  expect(colors.primary).toBe('#4361EE')
  expect(colors.accent).toBe('#4CC9F0')
  expect(colors.star).toBe('#FFD166')
})

test('radius.full is 999', () => {
  expect(radius.full).toBe(999)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/store/theme.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/constants/theme'`

- [ ] **Step 3: Create `src/constants/theme.ts`**

```ts
// src/constants/theme.ts
export const colors = {
  bg:          '#0f0f1a',
  bgCard:      '#1a1a2e',
  primary:     '#4361EE',
  primaryLight:'#6d87f5',
  accent:      '#4CC9F0',
  purple:      '#7209B7',
  star:        '#FFD166',
  success:     '#06D6A0',
  error:       '#EF233C',
  textPrimary: '#FFFFFF',
  textSecondary:'#a0a0c8',
  textMuted:   '#5a5a8a',
  border:      '#2d2d44',
} as const

export const fonts = {
  regular:   'Nunito_400Regular',
  semibold:  'Nunito_600SemiBold',
  bold:      'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black:     'Nunito_900Black',
} as const

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/store/theme.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/constants/theme.ts __tests__/store/theme.test.ts
git commit -m "feat: add theme constants (colors, fonts, radius)"
```

---

## Task 3: Zustand Auth Store

**Files:**
- Create: `src/store/useAuthStore.ts`
- Test: `__tests__/store/useAuthStore.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/store/useAuthStore.test.ts
import { act } from '@testing-library/react-native'
import { useAuthStore } from '../../src/store/useAuthStore'

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}))

import * as SecureStore from 'expo-secure-store'

beforeEach(() => {
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    activeLearner: null,
  })
  jest.clearAllMocks()
})

test('setTokens stores tokens in state and SecureStore', async () => {
  await act(async () => {
    await useAuthStore.getState().setTokens('acc123', 'ref456')
  })
  expect(useAuthStore.getState().accessToken).toBe('acc123')
  expect(useAuthStore.getState().refreshToken).toBe('ref456')
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'acc123')
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'ref456')
})

test('clearAuth removes tokens from state and SecureStore', async () => {
  useAuthStore.setState({ accessToken: 'acc123', refreshToken: 'ref456' })
  await act(async () => {
    await useAuthStore.getState().clearAuth()
  })
  expect(useAuthStore.getState().accessToken).toBeNull()
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token')
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token')
})

test('hydrate reads tokens from SecureStore into state', async () => {
  ;(SecureStore.getItemAsync as jest.Mock)
    .mockResolvedValueOnce('acc123')
    .mockResolvedValueOnce('ref456')
  await act(async () => {
    await useAuthStore.getState().hydrate()
  })
  expect(useAuthStore.getState().accessToken).toBe('acc123')
})

test('setActiveLearner sets learner in state', () => {
  const learner = { id: 'l1', name: 'Emma', avatarEmoji: '🦋' }
  act(() => {
    useAuthStore.getState().setActiveLearner(learner)
  })
  expect(useAuthStore.getState().activeLearner).toEqual(learner)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/store/useAuthStore.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/store/useAuthStore'`

- [ ] **Step 3: Create `src/store/useAuthStore.ts`**

```ts
// src/store/useAuthStore.ts
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

type ActiveLearner = { id: string; name: string; avatarEmoji: string }

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  activeLearner: ActiveLearner | null
  setTokens: (access: string, refresh: string) => Promise<void>
  clearAuth: () => Promise<void>
  setActiveLearner: (learner: ActiveLearner) => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  activeLearner: null,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync('access_token', access)
    await SecureStore.setItemAsync('refresh_token', refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    set({ accessToken: null, refreshToken: null, activeLearner: null })
  },

  setActiveLearner: (learner) => set({ activeLearner: learner }),

  hydrate: async () => {
    const access = await SecureStore.getItemAsync('access_token')
    const refresh = await SecureStore.getItemAsync('refresh_token')
    if (access && refresh) {
      set({ accessToken: access, refreshToken: refresh })
    }
  },
}))
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/store/useAuthStore.test.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/store/useAuthStore.ts __tests__/store/useAuthStore.test.ts
git commit -m "feat: add Zustand auth store with SecureStore persistence"
```

---

## Task 4: API Client + Auth API

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/auth.ts`
- Test: `__tests__/api/auth.test.ts`

- [ ] **Step 1: Create `src/api/client.ts`**

```ts
// src/api/client.ts
import { useAuthStore } from '../store/useAuthStore'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = useAuthStore.getState().accessToken
    if (token) headers['Authorization'] = `Bearer ${token}`
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

- [ ] **Step 2: Write failing tests for auth API**

```ts
// __tests__/api/auth.test.ts
import { authApi } from '../../src/api/auth'

jest.mock('../../src/api/client', () => ({
  apiRequest: jest.fn(),
}))

import { apiRequest } from '../../src/api/client'

const mockApiRequest = apiRequest as jest.Mock

beforeEach(() => mockApiRequest.mockReset())

test('register calls POST /auth/register without auth', async () => {
  mockApiRequest.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref' })
  const result = await authApi.register({ email: 'a@b.com', password: 'pass', pin: '1234' })
  expect(mockApiRequest).toHaveBeenCalledWith('/auth/register', {
    method: 'POST',
    body: { email: 'a@b.com', password: 'pass', pin: '1234' },
    auth: false,
  })
  expect(result.access_token).toBe('acc')
})

test('login calls POST /auth/login without auth', async () => {
  mockApiRequest.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref' })
  await authApi.login({ email: 'a@b.com', password: 'pass' })
  expect(mockApiRequest).toHaveBeenCalledWith('/auth/login', {
    method: 'POST',
    body: { email: 'a@b.com', password: 'pass' },
    auth: false,
  })
})

test('refresh calls POST /auth/refresh without auth', async () => {
  mockApiRequest.mockResolvedValue({ access_token: 'new-acc', refresh_token: 'new-ref' })
  await authApi.refresh({ refresh_token: 'old-ref' })
  expect(mockApiRequest).toHaveBeenCalledWith('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: 'old-ref' },
    auth: false,
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest __tests__/api/auth.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/api/auth'`

- [ ] **Step 4: Create `src/api/auth.ts`**

```ts
// src/api/auth.ts
import { apiRequest } from './client'

type AuthResponse = { access_token: string; refresh_token: string }

export const authApi = {
  register: (body: { email: string; password: string; pin: string }) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body, auth: false }),

  login: (body: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body, auth: false }),

  refresh: (body: { refresh_token: string }) =>
    apiRequest<AuthResponse>('/auth/refresh', { method: 'POST', body, auth: false }),
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/api/auth.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/api/client.ts src/api/auth.ts __tests__/api/auth.test.ts
git commit -m "feat: add API client and auth API (register, login, refresh)"
```

---

## Task 5: Learners API (needed for Register step 3)

**Files:**
- Create: `src/api/learners.ts`

- [ ] **Step 1: Create `src/api/learners.ts`**

```ts
// src/api/learners.ts
import { apiRequest } from './client'

export type Learner = {
  id: string
  name: string
  age: number
  grade_level: number
  avatar_emoji: string
  total_stars: number
  level: number
  xp: number
  streak_days: number
  last_active_at: string
}

export const learnersApi = {
  list: () =>
    apiRequest<Learner[]>('/learners'),

  create: (body: { name: string; age: number; grade_level: number; avatar_emoji: string }) =>
    apiRequest<Learner>('/learners', { method: 'POST', body }),
}
```

- [ ] **Step 2: Commit**

```bash
git add src/api/learners.ts
git commit -m "feat: add learners API (list, create)"
```

---

## Task 6: Navigation Skeleton

**Files:**
- Create: `src/navigation/RootNavigator.tsx`
- Create: `src/navigation/AuthNavigator.tsx`
- Create: `src/navigation/ChildNavigator.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Create `src/navigation/AuthNavigator.tsx`**

```tsx
// src/navigation/AuthNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { WelcomeScreen } from '../screens/auth/WelcomeScreen'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { RegisterScreen } from '../screens/auth/RegisterScreen'

export type AuthStackParams = {
  Welcome: undefined
  Login: undefined
  Register: undefined
}

const Stack = createNativeStackNavigator<AuthStackParams>()

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 2: Create placeholder auth screens** (will be replaced by Tasks 7–9)

```tsx
// src/screens/auth/WelcomeScreen.tsx
import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'
export function WelcomeScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>Welcome</Text></View>
}
```

```tsx
// src/screens/auth/LoginScreen.tsx
import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'
export function LoginScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>Login</Text></View>
}
```

```tsx
// src/screens/auth/RegisterScreen.tsx
import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'
export function RegisterScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>Register</Text></View>
}
```

- [ ] **Step 3: Create placeholder screens for child tabs — `src/screens/child/HomeScreen.tsx`**

```tsx
// src/screens/child/HomeScreen.tsx
import { View, Text } from 'react-native'
export function HomeScreen() {
  return <View className="flex-1 bg-bg items-center justify-center"><Text className="text-t-primary">Home (Plan 2)</Text></View>
}
```

Repeat for each tab — create these 4 files with the same pattern (change the label):
- `src/screens/child/LearnScreen.tsx` — label `"Learn (Plan 3)"`
- `src/screens/child/RanksScreen.tsx` — label `"Ranks (Plan 4)"`
- `src/screens/child/ProfileScreen.tsx` — label `"Profile (Plan 4)"`

- [ ] **Step 4: Create `src/navigation/ChildNavigator.tsx`**

```tsx
// src/navigation/ChildNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { HomeScreen } from '../screens/child/HomeScreen'
import { LearnScreen } from '../screens/child/LearnScreen'
import { RanksScreen } from '../screens/child/RanksScreen'
import { ProfileScreen } from '../screens/child/ProfileScreen'
import { colors } from '../constants/theme'

export type ChildTabParams = {
  Home: undefined
  Learn: undefined
  Ranks: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<ChildTabParams>()

export function ChildNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Ranks" component={RanksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 5: Create `src/navigation/RootNavigator.tsx`**

```tsx
// src/navigation/RootNavigator.tsx
import { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '../store/useAuthStore'
import { AuthNavigator } from './AuthNavigator'
import { ChildNavigator } from './ChildNavigator'

const Stack = createNativeStackNavigator()

export function RootNavigator() {
  const { accessToken, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {accessToken ? (
          <Stack.Screen name="Child" component={ChildNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

- [ ] **Step 6: Update `App.tsx` to use `RootNavigator`**

Replace the entire contents of `App.tsx` with:

```tsx
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { RootNavigator } from './src/navigation/RootNavigator'
import { colors } from './src/constants/theme'

const queryClient = new QueryClient()

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  })

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 7: Verify app runs with navigation skeleton**

```bash
npx expo start --clear
```

Expected: App launches showing the Welcome screen (which will be a placeholder until Task 7). No red-screen errors.

- [ ] **Step 8: Commit**

```bash
git add src/navigation/ src/screens/ App.tsx
git commit -m "feat: add navigation skeleton (Root, Auth, Child tab navigator)"
```

---

## Task 7: WelcomeScreen

**Files:**
- Create: `src/screens/auth/WelcomeScreen.tsx`
- Test: `__tests__/screens/WelcomeScreen.test.tsx`

Design reference: `Smarty Steps Login.html` (the landing section before any form appears)
Colors: bg `#0a0818`, primary `#4361EE`, accent `#4CC9F0`. Font: Nunito.

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/screens/WelcomeScreen.test.tsx
import { render, fireEvent } from '@testing-library/react-native'
import { WelcomeScreen } from '../../src/screens/auth/WelcomeScreen'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

beforeEach(() => mockNavigate.mockReset())

test('renders app name and tagline', () => {
  const { getByText } = render(<WelcomeScreen />)
  expect(getByText('Smarty Steps')).toBeTruthy()
  expect(getByText(/Math.*Science.*English/i)).toBeTruthy()
})

test('Get Started button navigates to Register', () => {
  const { getByText } = render(<WelcomeScreen />)
  fireEvent.press(getByText(/Get Started/i))
  expect(mockNavigate).toHaveBeenCalledWith('Register')
})

test('Sign In button navigates to Login', () => {
  const { getByText } = render(<WelcomeScreen />)
  fireEvent.press(getByText(/Sign In/i))
  expect(mockNavigate).toHaveBeenCalledWith('Login')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/WelcomeScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Create `src/screens/auth/WelcomeScreen.tsx`**

```tsx
// src/screens/auth/WelcomeScreen.tsx
import { View, Text, TouchableOpacity, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParams } from '../../navigation/AuthNavigator'
import { colors } from '../../constants/theme'

type Nav = NativeStackNavigationProp<AuthStackParams, 'Welcome'>

const FEATURE_PILLS = ['Math', 'Science', 'English']

export function WelcomeScreen() {
  const { navigate } = useNavigation<Nav>()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>

        {/* Hero emoji */}
        <Text style={{ fontSize: 72, marginBottom: 24 }}>🚀</Text>

        {/* App name */}
        <Text style={{
          fontSize: 36,
          fontFamily: 'Nunito_900Black',
          color: colors.textPrimary,
          marginBottom: 8,
          textAlign: 'center',
        }}>
          Smarty Steps
        </Text>

        {/* Tagline */}
        <Text style={{
          fontSize: 16,
          fontFamily: 'Nunito_600SemiBold',
          color: colors.textSecondary,
          marginBottom: 4,
          textAlign: 'center',
        }}>
          Math · Science · English
        </Text>

        <Text style={{
          fontSize: 13,
          fontFamily: 'Nunito_400Regular',
          color: colors.textMuted,
          marginBottom: 40,
          textAlign: 'center',
        }}>
          A learning adventure for ages 5–8.{'\n'}Parents stay in control.
        </Text>

        {/* Feature pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 48 }}>
          {FEATURE_PILLS.map((label) => (
            <View key={label} style={{
              backgroundColor: colors.bgCard,
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{ color: colors.accent, fontFamily: 'Nunito_700Bold', fontSize: 13 }}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={() => navigate('Register')}
          style={{
            width: '100%',
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 12,
          }}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>
            Get Started — it's free
          </Text>
        </TouchableOpacity>

        {/* Secondary CTA */}
        <TouchableOpacity onPress={() => navigate('Login')} activeOpacity={0.75}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold', fontSize: 15 }}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/WelcomeScreen.test.tsx --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/auth/WelcomeScreen.tsx __tests__/screens/WelcomeScreen.test.tsx
git commit -m "feat: add WelcomeScreen with navigation to Login and Register"
```

---

## Task 8: LoginScreen

**Files:**
- Create: `src/screens/auth/LoginScreen.tsx`
- Test: `__tests__/screens/LoginScreen.test.tsx`

Design reference: `Smarty Steps Login.html` — email + password form, sign-in button, link to register.

- [ ] **Step 1: Write failing tests**

```tsx
// __tests__/screens/LoginScreen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { LoginScreen } from '../../src/screens/auth/LoginScreen'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../src/api/auth', () => ({
  authApi: {
    login: jest.fn(),
  },
}))

jest.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({ setTokens: jest.fn() }),
}))

import { authApi } from '../../src/api/auth'
const mockLogin = authApi.login as jest.Mock

beforeEach(() => {
  mockNavigate.mockReset()
  mockLogin.mockReset()
})

test('renders email and password inputs', () => {
  const { getByPlaceholderText } = render(<LoginScreen />)
  expect(getByPlaceholderText(/email/i)).toBeTruthy()
  expect(getByPlaceholderText(/password/i)).toBeTruthy()
})

test('shows error when fields are empty and Sign In pressed', async () => {
  const { getByText } = render(<LoginScreen />)
  fireEvent.press(getByText(/Sign In/i))
  await waitFor(() => expect(getByText(/required/i)).toBeTruthy())
})

test('calls authApi.login and navigates to Child on success', async () => {
  mockLogin.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref' })
  const { getByPlaceholderText, getByText } = render(<LoginScreen />)
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'password123')
  fireEvent.press(getByText(/Sign In/i))
  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' }))
})

test('shows error message on login failure', async () => {
  mockLogin.mockRejectedValue(new Error('Invalid credentials'))
  const { getByPlaceholderText, getByText } = render(<LoginScreen />)
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'wrong')
  fireEvent.press(getByText(/Sign In/i))
  await waitFor(() => expect(getByText('Invalid credentials')).toBeTruthy())
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/LoginScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Create `src/screens/auth/LoginScreen.tsx`**

```tsx
// src/screens/auth/LoginScreen.tsx
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParams } from '../../navigation/AuthNavigator'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../store/useAuthStore'
import { colors } from '../../constants/theme'

type Nav = NativeStackNavigationProp<AuthStackParams, 'Login'>

export function LoginScreen() {
  const { navigate } = useNavigation<Nav>()
  const { setTokens } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login({ email: email.trim(), password })
      await setTokens(res.access_token, res.refresh_token)
      // RootNavigator automatically switches to ChildNavigator when accessToken is set
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>

        <Text style={{ fontSize: 28, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 8 }}>
          Welcome back
        </Text>
        <Text style={{ fontSize: 14, fontFamily: 'Nunito_400Regular', color: colors.textSecondary, marginBottom: 32 }}>
          Sign in to your parent account
        </Text>

        {/* Email */}
        <TextInput
          placeholder="Email address"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: colors.textPrimary,
            fontFamily: 'Nunito_400Regular',
            fontSize: 15,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        />

        {/* Password */}
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            color: colors.textPrimary,
            fontFamily: 'Nunito_400Regular',
            fontSize: 15,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
          }}
        />

        {/* Error */}
        {error ? (
          <Text style={{ color: colors.error, fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginBottom: 12 }}>
            {error}
          </Text>
        ) : (
          <View style={{ height: 12 + 13 + 12 }} />
        )}

        {/* Sign In button */}
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 20,
            opacity: loading ? 0.7 : 1,
          }}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>Sign In</Text>
          }
        </TouchableOpacity>

        {/* Link to Register */}
        <TouchableOpacity onPress={() => navigate('Register')} style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold', fontSize: 14 }}>
            Don't have an account?{' '}
            <Text style={{ color: colors.accent }}>Get Started</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/LoginScreen.test.tsx --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/auth/LoginScreen.tsx __tests__/screens/LoginScreen.test.tsx
git commit -m "feat: add LoginScreen with validation, auth call, and error handling"
```

---

## Task 9: RegisterScreen (3-step flow)

**Files:**
- Create: `src/screens/auth/RegisterScreen.tsx`
- Test: `__tests__/screens/RegisterScreen.test.tsx`

**Steps:**
1. Email + password entry
2. 4-digit PIN entry (used for Parent Dashboard access)
3. First learner — name, age (5–8), grade (K/1/2/3 → 0/1/2/3), avatar emoji picker

On completion: calls `authApi.register` → `setTokens` → calls `learnersApi.create` → `setActiveLearner` → RootNavigator routes to ChildNavigator automatically.

- [ ] **Step 1: Write failing tests**

```tsx
// __tests__/screens/RegisterScreen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { RegisterScreen } from '../../src/screens/auth/RegisterScreen'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../src/api/auth', () => ({ authApi: { register: jest.fn() } }))
jest.mock('../../src/api/learners', () => ({ learnersApi: { create: jest.fn() } }))
jest.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({ setTokens: jest.fn(), setActiveLearner: jest.fn() }),
}))

import { authApi } from '../../src/api/auth'
import { learnersApi } from '../../src/api/learners'
const mockRegister = authApi.register as jest.Mock
const mockCreate = learnersApi.create as jest.Mock

beforeEach(() => {
  mockNavigate.mockReset()
  mockRegister.mockReset()
  mockCreate.mockReset()
})

test('renders step 1 fields initially', () => {
  const { getByPlaceholderText } = render(<RegisterScreen />)
  expect(getByPlaceholderText(/email/i)).toBeTruthy()
  expect(getByPlaceholderText(/password/i)).toBeTruthy()
})

test('shows error and stays on step 1 when fields empty', async () => {
  const { getByText } = render(<RegisterScreen />)
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/required/i)).toBeTruthy())
})

test('advances to step 2 (PIN) after valid step 1 input', async () => {
  const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'password123')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/4-digit PIN/i)).toBeTruthy())
})

test('advances to step 3 (learner) after valid PIN', async () => {
  const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
  // Step 1
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'password123')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/4-digit PIN/i)).toBeTruthy())
  // Step 2
  fireEvent.changeText(getByPlaceholderText(/PIN/i), '1234')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/Add your first learner/i)).toBeTruthy())
})

test('calls register then learner create on final submit', async () => {
  mockRegister.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref' })
  mockCreate.mockResolvedValue({ id: 'l1', name: 'Emma', avatar_emoji: '🦋' })

  const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
  // Step 1
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'password123')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/4-digit PIN/i)).toBeTruthy())
  // Step 2
  fireEvent.changeText(getByPlaceholderText(/PIN/i), '1234')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/Add your first learner/i)).toBeTruthy())
  // Step 3
  fireEvent.changeText(getByPlaceholderText(/Learner's name/i), 'Emma')
  fireEvent.press(getByText(/Create Account/i))
  await waitFor(() => {
    expect(mockRegister).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123', pin: '1234' })
    expect(mockCreate).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/RegisterScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Create `src/screens/auth/RegisterScreen.tsx`**

```tsx
// src/screens/auth/RegisterScreen.tsx
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StatusBar,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParams } from '../../navigation/AuthNavigator'
import { authApi } from '../../api/auth'
import { learnersApi } from '../../api/learners'
import { useAuthStore } from '../../store/useAuthStore'
import { colors } from '../../constants/theme'

type Nav = NativeStackNavigationProp<AuthStackParams, 'Register'>

const AVATARS = ['🚀', '🦊', '🦁', '🌸', '⚡', '🌈', '🐯', '🦋', '🎯', '🌙', '🐧', '🦄']
const GRADES = [
  { label: 'K', value: 0, age: 5 },
  { label: '1', value: 1, age: 6 },
  { label: '2', value: 2, age: 7 },
  { label: '3', value: 3, age: 8 },
]

export function RegisterScreen() {
  const { navigate } = useNavigation<Nav>()
  const { setTokens, setActiveLearner } = useAuthStore()

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2
  const [pin, setPin] = useState('')

  // Step 3
  const [learnerName, setLearnerName] = useState('')
  const [gradeIndex, setGradeIndex] = useState(0)
  const [avatar, setAvatar] = useState(AVATARS[0])

  function handleStep1Next() {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setStep(2)
  }

  function handleStep2Next() {
    setError('')
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.')
      return
    }
    setStep(3)
  }

  async function handleStep3Submit() {
    setError('')
    if (!learnerName.trim()) {
      setError('Learner name is required.')
      return
    }
    setLoading(true)
    try {
      const auth = await authApi.register({ email: email.trim(), password, pin })
      await setTokens(auth.access_token, auth.refresh_token)
      const grade = GRADES[gradeIndex]
      const learner = await learnersApi.create({
        name: learnerName.trim(),
        age: grade.age,
        grade_level: grade.value,
        avatar_emoji: avatar,
      })
      setActiveLearner({ id: learner.id, name: learner.name, avatarEmoji: learner.avatar_emoji })
      // RootNavigator switches to ChildNavigator automatically
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  } as const

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}>

        {/* Step indicator */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              backgroundColor: s <= step ? colors.primary : colors.border,
            }} />
          ))}
        </View>

        {/* Step 1: Credentials */}
        {step === 1 && (
          <View>
            <Text style={{ fontSize: 26, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 8 }}>
              Create your account
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Nunito_400Regular', marginBottom: 28 }}>
              You're the parent — this is your account.
            </Text>
            <TextInput
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle}
            />
            <TextInput
              placeholder="Password (8+ characters)"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={inputStyle}
            />
            {error ? <Text style={{ color: colors.error, fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}
            <TouchableOpacity onPress={handleStep1Next} style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16 }} activeOpacity={0.85}>
              <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>Next</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigate('Login')} style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold', fontSize: 14 }}>
                Already have an account? <Text style={{ color: colors.accent }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: PIN */}
        {step === 2 && (
          <View>
            <Text style={{ fontSize: 26, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 8 }}>
              Set your 4-digit PIN
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Nunito_400Regular', marginBottom: 28 }}>
              You'll use this PIN to access the Parent Dashboard from the app.
            </Text>
            <TextInput
              placeholder="4-digit PIN"
              placeholderTextColor={colors.textMuted}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={inputStyle}
            />
            {error ? <Text style={{ color: colors.error, fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}
            <TouchableOpacity onPress={handleStep2Next} style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }} activeOpacity={0.85}>
              <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: First learner */}
        {step === 3 && (
          <View>
            <Text style={{ fontSize: 26, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 8 }}>
              Add your first learner
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Nunito_400Regular', marginBottom: 28 }}>
              You can add more learners later.
            </Text>

            {/* Name */}
            <TextInput
              placeholder="Learner's name"
              placeholderTextColor={colors.textMuted}
              value={learnerName}
              onChangeText={setLearnerName}
              style={inputStyle}
            />

            {/* Grade selector */}
            <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginBottom: 8 }}>Grade</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {GRADES.map((g, i) => (
                <TouchableOpacity
                  key={g.label}
                  onPress={() => setGradeIndex(i)}
                  style={{
                    flex: 1,
                    backgroundColor: gradeIndex === i ? colors.primary : colors.bgCard,
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: gradeIndex === i ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: gradeIndex === i ? '#fff' : colors.textSecondary, fontFamily: 'Nunito_700Bold', fontSize: 16 }}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Avatar picker */}
            <Text style={{ color: colors.textSecondary, fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginBottom: 8 }}>Pick an avatar</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {AVATARS.map((a) => (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAvatar(a)}
                  style={{
                    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: avatar === a ? colors.primary : colors.bgCard,
                    borderWidth: 2,
                    borderColor: avatar === a ? colors.accent : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={{ color: colors.error, fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleStep3Submit}
              disabled={loading}
              style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/RegisterScreen.test.tsx --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/auth/RegisterScreen.tsx __tests__/screens/RegisterScreen.test.tsx
git commit -m "feat: add RegisterScreen (3-step: credentials → PIN → first learner)"
```

---

## Plan 1 Complete

At this point the app has:
- Expo project bootstrapped with NativeWind, Nunito fonts, React Navigation, Zustand, TanStack Query
- Token persistence via Expo SecureStore with hydration on launch
- Typed API client with auto auth-header injection
- Auth API (register, login, refresh) + Learners API (list, create)
- Full navigation skeleton: RootNavigator switches Auth ↔ Child based on token
- WelcomeScreen, LoginScreen, RegisterScreen (3-step) — all with tests

**Next:** Plan 2 — Dashboard (learner selection, stars, streak, mascot, subject cards)
