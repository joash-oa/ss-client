# Smarty Steps — Plan 4: Ranks + Profile + Settings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build RanksScreen (global leaderboard), ProfileScreen (learner stats summary), SettingsScreen (logout + learner management), and nest Profile + Settings inside a `ProfileNavigator` stack.

**Architecture:** `ProfileNavigator` (native stack) is nested inside the `Profile` tab of `ChildNavigator` — Profile tab now shows ProfileScreen by default with a Settings button that pushes to SettingsScreen. `RanksScreen` is a direct tab screen. A new `useLeaderboard` hook (TanStack Query over `GET /leaderboard?learner_id=:id`) fetches ranked data. `ProfileScreen` reads the active learner from `useLearners` (already exists from Plan 2). `SettingsScreen` has a Logout button that calls `clearAuth` on the auth store.

**Tech Stack:** Same as Plans 1–3. No new packages required.

> This is Plan 4 of 5. Depends on Plan 1 (auth store, API client), Plan 2 (ChildNavigator, useLearners, Zustand activeLearner).

---

## File Map

```
ss-client/
├── src/
│   ├── api/
│   │   └── leaderboard.ts             # NEW: GET /leaderboard?learner_id=:id
│   ├── hooks/
│   │   └── useLeaderboard.ts          # NEW: useQuery wrapping leaderboardApi.get
│   ├── navigation/
│   │   ├── ChildNavigator.tsx         # Modify: Profile tab uses ProfileNavigator
│   │   └── ProfileNavigator.tsx       # NEW: stack — ProfileScreen → SettingsScreen
│   └── screens/
│       └── child/
│           ├── RanksScreen.tsx        # Replace placeholder — leaderboard UI
│           ├── ProfileScreen.tsx      # Replace placeholder — learner stats UI
│           └── SettingsScreen.tsx     # NEW — logout + learner management
├── __tests__/
│   ├── api/
│   │   └── leaderboard.test.ts        # NEW
│   ├── hooks/
│   │   └── useLeaderboard.test.tsx    # NEW
│   └── screens/
│       ├── RanksScreen.test.tsx       # NEW
│       ├── ProfileScreen.test.tsx     # NEW
│       └── SettingsScreen.test.tsx    # NEW
```

---

## Task 1: Leaderboard API

**Files:**
- Create: `src/api/leaderboard.ts`
- Create: `__tests__/api/leaderboard.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/api/leaderboard.test.ts
import { leaderboardApi } from '../../src/api/leaderboard'

jest.mock('../../src/api/client', () => ({ apiRequest: jest.fn() }))
import { apiRequest } from '../../src/api/client'
const mockReq = apiRequest as jest.Mock

beforeEach(() => mockReq.mockReset())

test('get calls GET /leaderboard with learner_id param', async () => {
  mockReq.mockResolvedValue({ entries: [] })
  await leaderboardApi.get('l1')
  expect(mockReq).toHaveBeenCalledWith('/leaderboard?learner_id=l1')
})

test('returns entries with rank and is_current fields', async () => {
  const response = {
    entries: [
      { rank: 1, learner_id: 'l2', name: 'Kai', avatar_emoji: '🦊', total_stars: 100, is_current: false },
      { rank: 2, learner_id: 'l1', name: 'Emma', avatar_emoji: '🦋', total_stars: 80, is_current: true },
    ],
  }
  mockReq.mockResolvedValue(response)
  const result = await leaderboardApi.get('l1')
  expect(result.entries).toHaveLength(2)
  expect(result.entries[1].is_current).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/api/leaderboard.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/api/leaderboard'`

- [ ] **Step 3: Create `src/api/leaderboard.ts`**

```ts
// src/api/leaderboard.ts
import { apiRequest } from './client'

export type LeaderboardEntry = {
  rank: number
  learner_id: string
  name: string
  avatar_emoji: string
  total_stars: number
  is_current: boolean
}

export type Leaderboard = {
  entries: LeaderboardEntry[]
}

export const leaderboardApi = {
  get: (learnerId: string) =>
    apiRequest<Leaderboard>(`/leaderboard?learner_id=${learnerId}`),
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/api/leaderboard.test.ts --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/api/leaderboard.ts __tests__/api/leaderboard.test.ts
git commit -m "feat: add leaderboard API"
```

---

## Task 2: `useLeaderboard` Hook

**Files:**
- Create: `src/hooks/useLeaderboard.ts`
- Create: `__tests__/hooks/useLeaderboard.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/hooks/useLeaderboard.test.tsx
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLeaderboard } from '../../src/hooks/useLeaderboard'

jest.mock('../../src/api/leaderboard', () => ({
  leaderboardApi: { get: jest.fn() },
}))
import { leaderboardApi } from '../../src/api/leaderboard'
const mockGet = leaderboardApi.get as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => mockGet.mockReset())

test('fetches leaderboard for given learnerId', async () => {
  const data = { entries: [{ rank: 1, learner_id: 'l1', name: 'Emma', avatar_emoji: '🦋', total_stars: 80, is_current: true }] }
  mockGet.mockResolvedValue(data)
  const { result } = renderHook(() => useLeaderboard('l1'), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(mockGet).toHaveBeenCalledWith('l1')
  expect(result.current.data?.entries).toHaveLength(1)
})

test('does not fetch when learnerId is null', async () => {
  const { result } = renderHook(() => useLeaderboard(null), { wrapper })
  expect(result.current.fetchStatus).toBe('idle')
  expect(mockGet).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/hooks/useLeaderboard.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/hooks/useLeaderboard'`

- [ ] **Step 3: Create `src/hooks/useLeaderboard.ts`**

```ts
// src/hooks/useLeaderboard.ts
import { useQuery } from '@tanstack/react-query'
import { leaderboardApi } from '../api/leaderboard'

export function useLeaderboard(learnerId: string | null) {
  return useQuery({
    queryKey: ['leaderboard', learnerId],
    queryFn: () => leaderboardApi.get(learnerId!),
    enabled: learnerId != null,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/hooks/useLeaderboard.test.tsx --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLeaderboard.ts __tests__/hooks/useLeaderboard.test.tsx
git commit -m "feat: add useLeaderboard TanStack Query hook"
```

---

## Task 3: ProfileNavigator + Update ChildNavigator

**Files:**
- Create: `src/navigation/ProfileNavigator.tsx`
- Modify: `src/navigation/ChildNavigator.tsx`

- [ ] **Step 1: Create `src/navigation/ProfileNavigator.tsx`**

```tsx
// src/navigation/ProfileNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ProfileScreen } from '../screens/child/ProfileScreen'
import { SettingsScreen } from '../screens/child/SettingsScreen'

export type ProfileStackParams = {
  ProfileScreen: undefined
  SettingsScreen: undefined
}

const Stack = createNativeStackNavigator<ProfileStackParams>()

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 2: Create a placeholder `SettingsScreen`** (replaced in Task 5)

```tsx
// src/screens/child/SettingsScreen.tsx
import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'
export function SettingsScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>Settings (Plan 4)</Text></View>
}
```

- [ ] **Step 3: Update `src/navigation/ChildNavigator.tsx` to nest `ProfileNavigator`**

Replace the full file contents:

```tsx
// src/navigation/ChildNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { HomeScreen } from '../screens/child/HomeScreen'
import { LearnNavigator, type LearnStackParams } from './LearnNavigator'
import { RanksScreen } from '../screens/child/RanksScreen'
import { ProfileNavigator, type ProfileStackParams } from './ProfileNavigator'
import { colors } from '../constants/theme'

export type ChildTabParams = {
  Home: undefined
  Learn: NavigatorScreenParams<LearnStackParams>
  Ranks: undefined
  Profile: NavigatorScreenParams<ProfileStackParams>
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
      <Tab.Screen name="Learn" component={LearnNavigator} />
      <Tab.Screen name="Ranks" component={RanksScreen} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 4: Verify app starts**

```bash
npx expo start --clear
```

Expected: Metro starts, Profile tab now uses the ProfileNavigator stack. No red-screen errors.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/ProfileNavigator.tsx src/navigation/ChildNavigator.tsx \
  src/screens/child/SettingsScreen.tsx
git commit -m "feat: add ProfileNavigator stack, nest inside ChildNavigator Profile tab"
```

---

## Task 4: RanksScreen

**Files:**
- Modify: `src/screens/child/RanksScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/RanksScreen.test.tsx`

**Design:** A scrollable leaderboard list. Each row shows rank number, avatar emoji, learner name, and star count. The active learner's row is highlighted in `colors.primary + '22'` with a distinct border. A loading indicator while fetching.

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/RanksScreen.test.tsx
import React from 'react'
import { render } from '@testing-library/react-native'
import { RanksScreen } from '../../src/screens/child/RanksScreen'

jest.mock('../../src/hooks/useLeaderboard', () => ({ useLeaderboard: jest.fn() }))
jest.mock('../../src/store/useAuthStore', () => ({ useAuthStore: jest.fn() }))

import { useLeaderboard } from '../../src/hooks/useLeaderboard'
import { useAuthStore } from '../../src/store/useAuthStore'
const mockUseLeaderboard = useLeaderboard as jest.Mock
const mockUseAuthStore = useAuthStore as jest.Mock

const ENTRIES = [
  { rank: 1, learner_id: 'l2', name: 'Kai',  avatar_emoji: '🦊', total_stars: 120, is_current: false },
  { rank: 2, learner_id: 'l1', name: 'Emma', avatar_emoji: '🦋', total_stars: 80,  is_current: true  },
  { rank: 3, learner_id: 'l3', name: 'Leo',  avatar_emoji: '🦁', total_stars: 60,  is_current: false },
]

beforeEach(() => {
  mockUseLeaderboard.mockReturnValue({ data: { entries: ENTRIES }, isLoading: false })
  mockUseAuthStore.mockReturnValue({ activeLearner: { id: 'l1', name: 'Emma', avatarEmoji: '🦋' } })
})

test('renders all learner names', () => {
  const { getByText } = render(<RanksScreen />)
  expect(getByText('Kai')).toBeTruthy()
  expect(getByText('Emma')).toBeTruthy()
  expect(getByText('Leo')).toBeTruthy()
})

test('renders rank numbers', () => {
  const { getByText } = render(<RanksScreen />)
  expect(getByText('#1')).toBeTruthy()
  expect(getByText('#2')).toBeTruthy()
  expect(getByText('#3')).toBeTruthy()
})

test('renders star counts', () => {
  const { getByText } = render(<RanksScreen />)
  expect(getByText('120')).toBeTruthy()
  expect(getByText('80')).toBeTruthy()
  expect(getByText('60')).toBeTruthy()
})

test('shows loading indicator while fetching', () => {
  mockUseLeaderboard.mockReturnValue({ data: undefined, isLoading: true })
  const { getByTestId } = render(<RanksScreen />)
  expect(getByTestId('loading-indicator')).toBeTruthy()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/RanksScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/child/RanksScreen.tsx`**

```tsx
// src/screens/child/RanksScreen.tsx
import { View, Text, ActivityIndicator, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '../../store/useAuthStore'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { colors } from '../../constants/theme'
import type { LeaderboardEntry } from '../../api/leaderboard'

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function EntryRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <View style={{
      backgroundColor: entry.is_current ? colors.primary + '22' : colors.bgCard,
      borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center',
      marginBottom: 10, borderWidth: 1,
      borderColor: entry.is_current ? colors.primary : colors.border,
    }}>
      <Text style={{ width: 36, fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.textMuted }}>
        {MEDAL[entry.rank] ?? `#${entry.rank}`}
      </Text>
      <Text style={{ fontSize: 26, marginRight: 12 }}>{entry.avatar_emoji}</Text>
      <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.textPrimary }}>
        {entry.name}
        {entry.is_current && (
          <Text style={{ fontFamily: 'Nunito_600SemiBold', color: colors.primary, fontSize: 12 }}> (You)</Text>
        )}
      </Text>
      <Text style={{ fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: colors.star }}>
        {entry.total_stars}
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginLeft: 4 }}>⭐</Text>
    </View>
  )
}

export function RanksScreen() {
  const { activeLearner } = useAuthStore()
  const { data, isLoading } = useLeaderboard(activeLearner?.id ?? null)

  if (isLoading) {
    return (
      <View testID="loading-indicator" style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 20 }}>
          Leaderboard 🏆
        </Text>
        {data?.entries.map((entry) => (
          <EntryRow key={entry.learner_id} entry={entry} />
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/RanksScreen.test.tsx --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/child/RanksScreen.tsx __tests__/screens/RanksScreen.test.tsx
git commit -m "feat: add RanksScreen with leaderboard, current learner highlight"
```

---

## Task 5: ProfileScreen

**Files:**
- Modify: `src/screens/child/ProfileScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/ProfileScreen.test.tsx`

**Design:** Shows the active learner's avatar, name, level, total stars, streak, and grade. A "Settings" button in the top-right corner navigates to SettingsScreen via the ProfileNavigator stack.

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/ProfileScreen.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ProfileScreen } from '../../src/screens/child/ProfileScreen'

jest.mock('../../src/hooks/useLearners', () => ({ useLearners: jest.fn() }))
jest.mock('../../src/store/useAuthStore', () => ({ useAuthStore: jest.fn() }))
const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

import { useLearners } from '../../src/hooks/useLearners'
import { useAuthStore } from '../../src/store/useAuthStore'
const mockUseLearners = useLearners as jest.Mock
const mockUseAuthStore = useAuthStore as jest.Mock

const LEARNER = {
  id: 'l1', name: 'Emma', avatar_emoji: '🦋',
  total_stars: 42, level: 3, xp: 280, streak_days: 5,
  age: 7, grade_level: 2, last_active_at: '',
}

beforeEach(() => {
  mockNavigate.mockReset()
  mockUseLearners.mockReturnValue({ data: [LEARNER], isLoading: false })
  mockUseAuthStore.mockReturnValue({ activeLearner: { id: 'l1', name: 'Emma', avatarEmoji: '🦋' } })
})

test('renders learner name, avatar, and level', () => {
  const { getByText } = render(<ProfileScreen />)
  expect(getByText('Emma')).toBeTruthy()
  expect(getByText('🦋')).toBeTruthy()
  expect(getByText(/Level 3/i)).toBeTruthy()
})

test('renders total stars and streak', () => {
  const { getByText } = render(<ProfileScreen />)
  expect(getByText('42')).toBeTruthy()
  expect(getByText('5')).toBeTruthy()
})

test('pressing Settings navigates to SettingsScreen', () => {
  const { getByText } = render(<ProfileScreen />)
  fireEvent.press(getByText(/settings/i))
  expect(mockNavigate).toHaveBeenCalledWith('SettingsScreen')
})

test('shows loading indicator while data is loading', () => {
  mockUseLearners.mockReturnValue({ data: undefined, isLoading: true })
  const { getByTestId } = render(<ProfileScreen />)
  expect(getByTestId('loading-indicator')).toBeTruthy()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/ProfileScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/child/ProfileScreen.tsx`**

```tsx
// src/screens/child/ProfileScreen.tsx
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { ProfileStackParams } from '../../navigation/ProfileNavigator'
import { useAuthStore } from '../../store/useAuthStore'
import { useLearners } from '../../hooks/useLearners'
import { colors } from '../../constants/theme'

type Nav = NativeStackNavigationProp<ProfileStackParams, 'ProfileScreen'>

const GRADE_LABELS: Record<number, string> = { 0: 'Kindergarten', 1: 'Grade 1', 2: 'Grade 2', 3: 'Grade 3' }
const XP_PER_LEVEL = 500

export function ProfileScreen() {
  const { navigate } = useNavigation<Nav>()
  const { activeLearner } = useAuthStore()
  const { data: learners, isLoading } = useLearners()

  const learner = learners?.find((l) => l.id === activeLearner?.id)
  const xpProgress = learner ? (learner.xp % XP_PER_LEVEL) / XP_PER_LEVEL : 0

  if (isLoading) {
    return (
      <View testID="loading-indicator" style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0 }}>
        <Text style={{ flex: 1, fontSize: 24, fontFamily: 'Nunito_900Black', color: colors.textPrimary }}>
          Profile
        </Text>
        <TouchableOpacity onPress={() => navigate('SettingsScreen')}>
          <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.accent }}>Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Avatar + Name */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: colors.primary, marginBottom: 12,
          }}>
            <Text style={{ fontSize: 40 }}>{activeLearner?.avatarEmoji ?? '🚀'}</Text>
          </View>
          <Text style={{ fontSize: 24, fontFamily: 'Nunito_900Black', color: colors.textPrimary }}>
            {activeLearner?.name ?? ''}
          </Text>
          <Text style={{ fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted, marginTop: 4 }}>
            Level {learner?.level ?? 1} · {GRADE_LABELS[learner?.grade_level ?? 0] ?? 'Grade 1'}
          </Text>
        </View>

        {/* XP Bar */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>XP Progress</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>
              {learner ? learner.xp % XP_PER_LEVEL : 0} / {XP_PER_LEVEL}
            </Text>
          </View>
          <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 5 }}>
            <View style={{
              height: 10, borderRadius: 5, backgroundColor: colors.primary,
              width: `${Math.round(xpProgress * 100)}%`,
            }} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 28, fontFamily: 'Nunito_900Black', color: colors.star }}>
              {learner?.total_stars ?? 0}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted, marginTop: 4 }}>Total Stars</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 28, fontFamily: 'Nunito_900Black', color: colors.accent }}>
              {learner?.streak_days ?? 0}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted, marginTop: 4 }}>Day Streak</Text>
          </View>
        </View>
        <View style={{ backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 28, fontFamily: 'Nunito_900Black', color: colors.success }}>
            {learner?.level ?? 1}
          </Text>
          <Text style={{ fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted, marginTop: 4 }}>Level</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/ProfileScreen.test.tsx --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/child/ProfileScreen.tsx __tests__/screens/ProfileScreen.test.tsx
git commit -m "feat: add ProfileScreen with learner stats, XP bar, and Settings navigation"
```

---

## Task 6: SettingsScreen

**Files:**
- Modify: `src/screens/child/SettingsScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/SettingsScreen.test.tsx`

**Design:** Shows a list of current learners (name + avatar) for context. A "Logout" button at the bottom that calls `clearAuth` on the store (which triggers `RootNavigator` to switch back to `AuthNavigator`). A "Parent Dashboard" button that navigates to the `Parent` screen in `RootNavigator` (implemented in Plan 5).

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/SettingsScreen.test.tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { SettingsScreen } from '../../src/screens/child/SettingsScreen'

jest.mock('../../src/hooks/useLearners', () => ({ useLearners: jest.fn() }))
jest.mock('../../src/store/useAuthStore', () => ({ useAuthStore: jest.fn() }))
const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

import { useLearners } from '../../src/hooks/useLearners'
import { useAuthStore } from '../../src/store/useAuthStore'
const mockUseLearners = useLearners as jest.Mock
const mockUseAuthStore = useAuthStore as jest.Mock

const LEARNERS = [
  { id: 'l1', name: 'Emma', avatar_emoji: '🦋', total_stars: 42, level: 3, xp: 280, streak_days: 5, age: 7, grade_level: 2, last_active_at: '' },
  { id: 'l2', name: 'Kai',  avatar_emoji: '🦊', total_stars: 10, level: 1, xp: 50,  streak_days: 2, age: 6, grade_level: 1, last_active_at: '' },
]

const mockClearAuth = jest.fn()

beforeEach(() => {
  mockNavigate.mockReset()
  mockClearAuth.mockReset()
  mockUseLearners.mockReturnValue({ data: LEARNERS, isLoading: false })
  mockUseAuthStore.mockReturnValue({
    activeLearner: { id: 'l1', name: 'Emma', avatarEmoji: '🦋' },
    clearAuth: mockClearAuth,
  })
})

test('renders all learner names', () => {
  const { getByText } = render(<SettingsScreen />)
  expect(getByText('Emma')).toBeTruthy()
  expect(getByText('Kai')).toBeTruthy()
})

test('renders Logout button', () => {
  const { getByText } = render(<SettingsScreen />)
  expect(getByText(/logout/i)).toBeTruthy()
})

test('pressing Logout calls clearAuth', async () => {
  mockClearAuth.mockResolvedValue(undefined)
  const { getByText } = render(<SettingsScreen />)
  fireEvent.press(getByText(/logout/i))
  await waitFor(() => expect(mockClearAuth).toHaveBeenCalled())
})

test('renders Parent Dashboard button', () => {
  const { getByText } = render(<SettingsScreen />)
  expect(getByText(/parent dashboard/i)).toBeTruthy()
})

test('pressing Parent Dashboard navigates to Parent screen', () => {
  const { getByText } = render(<SettingsScreen />)
  fireEvent.press(getByText(/parent dashboard/i))
  expect(mockNavigate).toHaveBeenCalledWith('Parent')
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/SettingsScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/child/SettingsScreen.tsx`**

```tsx
// src/screens/child/SettingsScreen.tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useAuthStore } from '../../store/useAuthStore'
import { useLearners } from '../../hooks/useLearners'
import { colors } from '../../constants/theme'

export function SettingsScreen() {
  const { navigate } = useNavigation<any>()
  const { clearAuth } = useAuthStore()
  const { data: learners } = useLearners()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await clearAuth()
    // RootNavigator switches to AuthNavigator automatically when accessToken is cleared
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 24 }}>
          Settings
        </Text>

        {/* Learners Section */}
        <Text style={{ fontSize: 14, fontFamily: 'Nunito_700Bold', color: colors.textMuted, marginBottom: 12 }}>
          LEARNERS
        </Text>
        {learners?.map((l) => (
          <View key={l.id} style={{
            backgroundColor: colors.bgCard, borderRadius: 14, padding: 14,
            flexDirection: 'row', alignItems: 'center',
            marginBottom: 10, borderWidth: 1, borderColor: colors.border,
          }}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>{l.avatar_emoji}</Text>
            <View>
              <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.textPrimary }}>{l.name}</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>
                Level {l.level} · {l.total_stars} stars
              </Text>
            </View>
          </View>
        ))}

        {/* Parent Dashboard */}
        <TouchableOpacity
          onPress={() => navigate('Parent')}
          style={{
            backgroundColor: colors.bgCard, borderRadius: 14, padding: 16,
            flexDirection: 'row', alignItems: 'center',
            borderWidth: 1, borderColor: colors.border, marginTop: 24, marginBottom: 12,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20, marginRight: 12 }}>👨‍👩‍👧</Text>
          <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.textPrimary }}>
            Parent Dashboard
          </Text>
          <Text style={{ fontSize: 18, color: colors.textMuted }}>›</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          style={{
            backgroundColor: colors.error + '22', borderRadius: 14, padding: 16,
            alignItems: 'center', borderWidth: 1, borderColor: colors.error + '55',
            opacity: loggingOut ? 0.7 : 1,
          }}
          activeOpacity={0.8}
        >
          {loggingOut
            ? <ActivityIndicator color={colors.error} />
            : <Text style={{ fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.error }}>Logout</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/SettingsScreen.test.tsx --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/child/SettingsScreen.tsx __tests__/screens/SettingsScreen.test.tsx
git commit -m "feat: add SettingsScreen with learner list, Parent Dashboard entry, and logout"
```

---

## Plan 4 Complete

At this point the app has:
- Leaderboard API + `useLeaderboard` hook
- `ProfileNavigator` stack nested in Profile tab
- `RanksScreen` with ranked leaderboard, current learner highlighted
- `ProfileScreen` with learner stats, XP bar, and Settings navigation
- `SettingsScreen` with learner list, Parent Dashboard button (wired in Plan 5), and logout

**Next:** Plan 5 — Parent Dashboard (PIN verification, parent-only view of learner progress)
