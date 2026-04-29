# Smarty Steps — Plan 2: Dashboard (HomeScreen)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the HomeScreen dashboard showing the active learner's stats (stars, streak, level, XP progress bar), a learner switcher, and subject cards (Math, Science, English) that navigate to the Learn tab.

**Architecture:** `HomeScreen` reads `activeLearner` from Zustand and fetches the full learner list via `useLearners` (TanStack Query over `GET /learners`). Learner switching calls `setActiveLearner` in the store. Subject cards call `navigation.navigate('Learn')` to switch to the Learn tab.

**Tech Stack:** Expo SDK 52, React Navigation 6 bottom-tabs, NativeWind 4, Zustand 5, TanStack Query 5, Jest + RNTL

> This is Plan 2 of 5. Depends on Plan 1 (auth store, API client, `learnersApi.list` + `learnersApi.create`, navigation skeleton with ChildNavigator bottom tabs).

---

## File Map

```
ss-client/
├── src/
│   ├── api/
│   │   └── learners.ts           # Modify: add get(id) — GET /learners/:id
│   ├── hooks/
│   │   └── useLearners.ts        # NEW: useQuery wrapping learnersApi.list
│   └── screens/
│       └── child/
│           └── HomeScreen.tsx    # Replace placeholder — full dashboard UI
├── __tests__/
│   ├── api/
│   │   └── learners.test.ts      # NEW: covers list, get, create
│   ├── hooks/
│   │   └── useLearners.test.tsx  # NEW
│   └── screens/
│       └── HomeScreen.test.tsx   # Replace placeholder — full dashboard tests
```

---

## Task 1: Extend Learners API with `get`

**Files:**
- Modify: `src/api/learners.ts`
- Create: `__tests__/api/learners.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/api/learners.test.ts
import { learnersApi } from '../../src/api/learners'

jest.mock('../../src/api/client', () => ({ apiRequest: jest.fn() }))
import { apiRequest } from '../../src/api/client'
const mockReq = apiRequest as jest.Mock

beforeEach(() => mockReq.mockReset())

test('list calls GET /learners', async () => {
  mockReq.mockResolvedValue([])
  await learnersApi.list()
  expect(mockReq).toHaveBeenCalledWith('/learners')
})

test('get calls GET /learners/:id', async () => {
  const learner = { id: 'l1', name: 'Emma', total_stars: 10, level: 2, xp: 150, streak_days: 3 }
  mockReq.mockResolvedValue(learner)
  const result = await learnersApi.get('l1')
  expect(mockReq).toHaveBeenCalledWith('/learners/l1')
  expect(result.id).toBe('l1')
})

test('create calls POST /learners', async () => {
  mockReq.mockResolvedValue({ id: 'l2', name: 'Kai' })
  await learnersApi.create({ name: 'Kai', age: 6, grade_level: 1, avatar_emoji: '🦊' })
  expect(mockReq).toHaveBeenCalledWith('/learners', {
    method: 'POST',
    body: { name: 'Kai', age: 6, grade_level: 1, avatar_emoji: '🦊' },
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/api/learners.test.ts --no-coverage
```

Expected: FAIL — `learnersApi.get is not a function`

- [ ] **Step 3: Replace the full contents of `src/api/learners.ts`**

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
  list: () => apiRequest<Learner[]>('/learners'),

  get: (id: string) => apiRequest<Learner>(`/learners/${id}`),

  create: (body: { name: string; age: number; grade_level: number; avatar_emoji: string }) =>
    apiRequest<Learner>('/learners', { method: 'POST', body }),
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/api/learners.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/api/learners.ts __tests__/api/learners.test.ts
git commit -m "feat: add learnersApi.get for fetching individual learner"
```

---

## Task 2: `useLearners` Hook

**Files:**
- Create: `src/hooks/useLearners.ts`
- Create: `__tests__/hooks/useLearners.test.tsx`

- [ ] **Step 1: Create directory and write the failing test**

```bash
mkdir -p src/hooks __tests__/hooks
```

```tsx
// __tests__/hooks/useLearners.test.tsx
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLearners } from '../../src/hooks/useLearners'

jest.mock('../../src/api/learners', () => ({
  learnersApi: { list: jest.fn() },
}))

import { learnersApi } from '../../src/api/learners'
const mockList = learnersApi.list as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => mockList.mockReset())

test('returns learner list on success', async () => {
  const learners = [
    { id: 'l1', name: 'Emma', avatar_emoji: '🦋', total_stars: 5, level: 1, xp: 50, streak_days: 2, age: 6, grade_level: 1, last_active_at: '' },
  ]
  mockList.mockResolvedValue(learners)
  const { result } = renderHook(() => useLearners(), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual(learners)
})

test('isLoading is true while fetching', async () => {
  mockList.mockReturnValue(new Promise(() => {}))
  const { result } = renderHook(() => useLearners(), { wrapper })
  expect(result.current.isLoading).toBe(true)
})

test('isError is true on failure', async () => {
  mockList.mockRejectedValue(new Error('Network error'))
  const { result } = renderHook(() => useLearners(), { wrapper })
  await waitFor(() => expect(result.current.isError).toBe(true))
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/hooks/useLearners.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/hooks/useLearners'`

- [ ] **Step 3: Create `src/hooks/useLearners.ts`**

```ts
// src/hooks/useLearners.ts
import { useQuery } from '@tanstack/react-query'
import { learnersApi } from '../api/learners'

export function useLearners() {
  return useQuery({
    queryKey: ['learners'],
    queryFn: learnersApi.list,
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/hooks/useLearners.test.tsx --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLearners.ts __tests__/hooks/useLearners.test.tsx
git commit -m "feat: add useLearners TanStack Query hook"
```

---

## Task 3: HomeScreen

**Files:**
- Modify: `src/screens/child/HomeScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/HomeScreen.test.tsx`

**Design:** Learner card at top (avatar, name, "Level N", XP progress bar), two stat badges (stars, streak), three subject cards (Math 🔢, Science 🔬, English 📚) in a vertical list, learner switcher row at the bottom when multiple learners exist.

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/HomeScreen.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { HomeScreen } from '../../src/screens/child/HomeScreen'

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
  mockUseLearners.mockReturnValue({ data: [LEARNER], isLoading: false, isError: false })
  mockUseAuthStore.mockReturnValue({
    activeLearner: { id: 'l1', name: 'Emma', avatarEmoji: '🦋' },
    setActiveLearner: jest.fn(),
  })
})

test('renders learner name and avatar emoji', () => {
  const { getByText } = render(<HomeScreen />)
  expect(getByText('Emma')).toBeTruthy()
  expect(getByText('🦋')).toBeTruthy()
})

test('renders total_stars and streak_days for active learner', () => {
  const { getByText } = render(<HomeScreen />)
  expect(getByText('42')).toBeTruthy()
  expect(getByText('5')).toBeTruthy()
})

test('renders Math, Science, and English subject cards', () => {
  const { getByText } = render(<HomeScreen />)
  expect(getByText('Math')).toBeTruthy()
  expect(getByText('Science')).toBeTruthy()
  expect(getByText('English')).toBeTruthy()
})

test('pressing a subject card navigates to Learn tab', () => {
  const { getByText } = render(<HomeScreen />)
  fireEvent.press(getByText('Math'))
  expect(mockNavigate).toHaveBeenCalledWith('Learn')
})

test('shows loading indicator when data is loading', () => {
  mockUseLearners.mockReturnValue({ data: undefined, isLoading: true, isError: false })
  const { getByTestId } = render(<HomeScreen />)
  expect(getByTestId('loading-indicator')).toBeTruthy()
})

test('shows other learner names in switcher row when multiple learners exist', () => {
  const LEARNER_2 = { ...LEARNER, id: 'l2', name: 'Kai', avatar_emoji: '🦊' }
  mockUseLearners.mockReturnValue({ data: [LEARNER, LEARNER_2], isLoading: false, isError: false })
  const { getByText } = render(<HomeScreen />)
  expect(getByText('Kai')).toBeTruthy()
})

test('pressing another learner in switcher calls setActiveLearner', () => {
  const mockSet = jest.fn()
  mockUseAuthStore.mockReturnValue({
    activeLearner: { id: 'l1', name: 'Emma', avatarEmoji: '🦋' },
    setActiveLearner: mockSet,
  })
  const LEARNER_2 = { ...LEARNER, id: 'l2', name: 'Kai', avatar_emoji: '🦊' }
  mockUseLearners.mockReturnValue({ data: [LEARNER, LEARNER_2], isLoading: false, isError: false })
  const { getByText } = render(<HomeScreen />)
  fireEvent.press(getByText('Kai'))
  expect(mockSet).toHaveBeenCalledWith({ id: 'l2', name: 'Kai', avatarEmoji: '🦊' })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/HomeScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/child/HomeScreen.tsx`**

```tsx
// src/screens/child/HomeScreen.tsx
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { ChildTabParams } from '../../navigation/ChildNavigator'
import { useAuthStore } from '../../store/useAuthStore'
import { useLearners } from '../../hooks/useLearners'
import { colors } from '../../constants/theme'
import type { Learner } from '../../api/learners'

type Nav = BottomTabNavigationProp<ChildTabParams, 'Home'>

const SUBJECTS = [
  { name: 'Math',    emoji: '🔢', color: colors.primary },
  { name: 'Science', emoji: '🔬', color: colors.purple  },
  { name: 'English', emoji: '📚', color: colors.accent  },
] as const

const XP_PER_LEVEL = 500

export function HomeScreen() {
  const { navigate } = useNavigation<Nav>()
  const { activeLearner, setActiveLearner } = useAuthStore()
  const { data: learners, isLoading } = useLearners()

  const fullLearner: Learner | undefined = learners?.find((l) => l.id === activeLearner?.id)
  const xpProgress = fullLearner ? (fullLearner.xp % XP_PER_LEVEL) / XP_PER_LEVEL : 0
  const otherLearners = learners?.filter((l) => l.id !== activeLearner?.id) ?? []

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

        {/* Learner Card */}
        <View style={{
          backgroundColor: colors.bgCard, borderRadius: 20, padding: 20,
          marginBottom: 20, borderWidth: 1, borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bg,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: colors.primary, marginRight: 14,
            }}>
              <Text style={{ fontSize: 28 }}>{activeLearner?.avatarEmoji ?? '🚀'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: colors.textPrimary }}>
                {activeLearner?.name ?? ''}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>
                Level {fullLearner?.level ?? 1}
              </Text>
            </View>
          </View>

          {/* XP bar */}
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, marginBottom: 16 }}>
            <View style={{
              height: 8, borderRadius: 4, backgroundColor: colors.primary,
              width: `${Math.round(xpProgress * 100)}%`,
            }} />
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontFamily: 'Nunito_900Black', color: colors.star }}>
                {fullLearner?.total_stars ?? 0}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>Stars</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.bg, borderRadius: 12, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontFamily: 'Nunito_900Black', color: colors.accent }}>
                {fullLearner?.streak_days ?? 0}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>Day Streak</Text>
            </View>
          </View>
        </View>

        {/* Subject Cards */}
        <Text style={{ fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: colors.textPrimary, marginBottom: 12 }}>
          Choose a Subject
        </Text>
        <View style={{ gap: 12, marginBottom: 24 }}>
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject.name}
              onPress={() => navigate('Learn')}
              style={{
                backgroundColor: colors.bgCard, borderRadius: 16, padding: 20,
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 1, borderColor: colors.border,
              }}
              activeOpacity={0.8}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: subject.color + '22',
                alignItems: 'center', justifyContent: 'center', marginRight: 16,
              }}>
                <Text style={{ fontSize: 24 }}>{subject.emoji}</Text>
              </View>
              <Text style={{ fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: colors.textPrimary }}>
                {subject.name}
              </Text>
              <Text style={{ marginLeft: 'auto', fontSize: 20, color: colors.textMuted }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Learner Switcher */}
        {otherLearners.length > 0 && (
          <View>
            <Text style={{ fontSize: 14, fontFamily: 'Nunito_700Bold', color: colors.textMuted, marginBottom: 10 }}>
              Switch Learner
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {otherLearners.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => setActiveLearner({ id: l.id, name: l.name, avatarEmoji: l.avatar_emoji })}
                  style={{
                    backgroundColor: colors.bgCard, borderRadius: 12, padding: 10,
                    alignItems: 'center', borderWidth: 1, borderColor: colors.border, minWidth: 70,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{l.avatar_emoji}</Text>
                  <Text style={{ fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: colors.textSecondary, marginTop: 4 }}>
                    {l.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/HomeScreen.test.tsx --no-coverage
```

Expected: PASS (7 tests)

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/child/HomeScreen.tsx __tests__/screens/HomeScreen.test.tsx
git commit -m "feat: add HomeScreen dashboard with learner stats, subject cards, and switcher"
```

---

## Plan 2 Complete

At this point the app has:
- `learnersApi.get` for individual learner data
- `useLearners` TanStack Query hook
- Full HomeScreen: learner card, XP bar, stats, subject cards, learner switcher

**Next:** Plan 3 — Learn + Lesson (curriculum browsing, exercise player, chapter quiz)
