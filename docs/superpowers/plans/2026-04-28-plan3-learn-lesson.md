# Smarty Steps — Plan 3: Learn + Lesson

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Learn flow — curriculum browsing (subjects → chapters → lessons), a lesson exercise player with per-exercise answer checking, and a chapter quiz screen.

**Architecture:** `LearnNavigator` is a native stack nested inside the `Learn` tab of `ChildNavigator`. `LearnScreen` uses `useCurriculum` (TanStack Query over `GET /curriculum?learner_id=:id`) to display subjects/chapters/lessons with `locked` states sourced directly from the API. `LessonScreen` uses `useLesson` and calls `checkAnswer` per exercise, then submits `progress` when all are answered. `QuizScreen` guards on the `generated` field — shows "coming soon" if `false` — and submits all answers in one call, displaying `effective_stars` from the response. All hooks read `activeLearner.id` from `useAuthStore`.

**Tech Stack:** Same as Plans 1–2. No new packages required.

> This is Plan 3 of 5. Depends on Plan 1 (auth store, API client) and Plan 2 (`ChildNavigator`, Zustand `activeLearner`).

---

## File Map

```
ss-client/
├── src/
│   ├── api/
│   │   └── curriculum.ts              # NEW: all curriculum + lesson + quiz endpoints
│   ├── hooks/
│   │   ├── useCurriculum.ts           # NEW: useQuery wrapping curriculumApi.get
│   │   ├── useLesson.ts               # NEW: useQuery wrapping curriculumApi.getLesson
│   │   └── useQuiz.ts                 # NEW: useQuery wrapping curriculumApi.getQuiz
│   ├── navigation/
│   │   ├── ChildNavigator.tsx         # Modify: Learn tab uses LearnNavigator
│   │   └── LearnNavigator.tsx         # NEW: stack — LearnScreen → LessonScreen → QuizScreen
│   └── screens/
│       └── child/
│           ├── LearnScreen.tsx        # Replace placeholder — subjects/chapters/lessons list
│           ├── LessonScreen.tsx       # NEW — exercise player
│           └── QuizScreen.tsx         # NEW — chapter quiz
├── __tests__/
│   ├── api/
│   │   └── curriculum.test.ts         # NEW
│   ├── hooks/
│   │   ├── useCurriculum.test.tsx     # NEW
│   │   ├── useLesson.test.tsx         # NEW
│   │   └── useQuiz.test.tsx           # NEW
│   └── screens/
│       ├── LearnScreen.test.tsx       # NEW
│       ├── LessonScreen.test.tsx      # NEW
│       └── QuizScreen.test.tsx        # NEW
```

---

## Task 1: Curriculum API

**Files:**
- Create: `src/api/curriculum.ts`
- Create: `__tests__/api/curriculum.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/api/curriculum.test.ts
import { curriculumApi } from '../../src/api/curriculum'

jest.mock('../../src/api/client', () => ({ apiRequest: jest.fn() }))
import { apiRequest } from '../../src/api/client'
const mockReq = apiRequest as jest.Mock

beforeEach(() => mockReq.mockReset())

test('get calls GET /curriculum with learner_id query param', async () => {
  mockReq.mockResolvedValue([])
  await curriculumApi.get('l1')
  expect(mockReq).toHaveBeenCalledWith('/curriculum?learner_id=l1')
})

test('getLesson calls GET /lessons/:id with learner_id', async () => {
  mockReq.mockResolvedValue({ id: 'les1', title: 'Addition', exercises: [] })
  await curriculumApi.getLesson('les1', 'l1')
  expect(mockReq).toHaveBeenCalledWith('/lessons/les1?learner_id=l1')
})

test('checkAnswer calls POST /lessons/:id/check-answer', async () => {
  mockReq.mockResolvedValue({ correct: true })
  await curriculumApi.checkAnswer('les1', { learner_id: 'l1', exercise_id: 'ex1', answer: 'A' })
  expect(mockReq).toHaveBeenCalledWith('/lessons/les1/check-answer', {
    method: 'POST',
    body: { learner_id: 'l1', exercise_id: 'ex1', answer: 'A' },
  })
})

test('submitProgress calls POST /lessons/:id/progress', async () => {
  mockReq.mockResolvedValue({ completed: true })
  await curriculumApi.submitProgress('les1', { learner_id: 'l1', exercise_ids: ['ex1', 'ex2'] })
  expect(mockReq).toHaveBeenCalledWith('/lessons/les1/progress', {
    method: 'POST',
    body: { learner_id: 'l1', exercise_ids: ['ex1', 'ex2'] },
  })
})

test('getQuiz calls GET /chapters/:id/quiz with learner_id', async () => {
  mockReq.mockResolvedValue({ generated: true, questions: [] })
  await curriculumApi.getQuiz('ch1', 'l1')
  expect(mockReq).toHaveBeenCalledWith('/chapters/ch1/quiz?learner_id=l1')
})

test('submitQuiz calls POST /chapters/:id/quiz/submit', async () => {
  mockReq.mockResolvedValue({ passed: true, stars_earned: 3, effective_stars: 3, score: 100 })
  await curriculumApi.submitQuiz('ch1', {
    learner_id: 'l1',
    answers: [{ question_id: 'q1', answer: 'A' }],
  })
  expect(mockReq).toHaveBeenCalledWith('/chapters/ch1/quiz/submit', {
    method: 'POST',
    body: { learner_id: 'l1', answers: [{ question_id: 'q1', answer: 'A' }] },
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/curriculum.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../src/api/curriculum'`

- [ ] **Step 3: Create `src/api/curriculum.ts`**

```ts
// src/api/curriculum.ts
import { apiRequest } from './client'

export type Exercise = {
  id: string
  type: 'multiple_choice' | 'true_false' | 'fill_blank'
  prompt: string
  options: string[] | null
}

export type LessonSummary = {
  id: string
  title: string
  order: number
  locked: boolean
  completed: boolean
}

export type ChapterSummary = {
  id: string
  title: string
  order: number
  locked: boolean
  quiz: { generated: boolean }
  lessons: LessonSummary[]
}

export type SubjectWithChapters = {
  id: string
  name: string
  emoji: string
  chapters: ChapterSummary[]
}

export type LessonDetail = {
  id: string
  title: string
  exercises: Exercise[]
}

export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
}

export type Quiz = {
  generated: boolean
  questions: QuizQuestion[]
}

export type CheckAnswerResponse = {
  correct: boolean
  feedback?: string
}

export type ProgressResponse = {
  completed: boolean
}

export type QuizSubmitResponse = {
  passed: boolean
  stars_earned: number
  effective_stars: number
  score: number
}

export const curriculumApi = {
  get: (learnerId: string) =>
    apiRequest<SubjectWithChapters[]>(`/curriculum?learner_id=${learnerId}`),

  getLesson: (lessonId: string, learnerId: string) =>
    apiRequest<LessonDetail>(`/lessons/${lessonId}?learner_id=${learnerId}`),

  checkAnswer: (
    lessonId: string,
    body: { learner_id: string; exercise_id: string; answer: string }
  ) =>
    apiRequest<CheckAnswerResponse>(`/lessons/${lessonId}/check-answer`, { method: 'POST', body }),

  submitProgress: (
    lessonId: string,
    body: { learner_id: string; exercise_ids: string[] }
  ) =>
    apiRequest<ProgressResponse>(`/lessons/${lessonId}/progress`, { method: 'POST', body }),

  getQuiz: (chapterId: string, learnerId: string) =>
    apiRequest<Quiz>(`/chapters/${chapterId}/quiz?learner_id=${learnerId}`),

  submitQuiz: (
    chapterId: string,
    body: { learner_id: string; answers: Array<{ question_id: string; answer: string }> }
  ) =>
    apiRequest<QuizSubmitResponse>(`/chapters/${chapterId}/quiz/submit`, { method: 'POST', body }),
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/curriculum.test.ts --no-coverage
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/api/curriculum.ts __tests__/api/curriculum.test.ts
git commit -m "feat: add curriculum API (curriculum, lesson, check-answer, progress, quiz)"
```

---

## Task 2: `useCurriculum`, `useLesson`, and `useQuiz` Hooks

**Files:**
- Create: `src/hooks/useCurriculum.ts`
- Create: `src/hooks/useLesson.ts`
- Create: `src/hooks/useQuiz.ts`
- Create: `__tests__/hooks/useCurriculum.test.tsx`
- Create: `__tests__/hooks/useLesson.test.tsx`
- Create: `__tests__/hooks/useQuiz.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/hooks/useCurriculum.test.tsx
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCurriculum } from '../../src/hooks/useCurriculum'

jest.mock('../../src/api/curriculum', () => ({
  curriculumApi: { get: jest.fn() },
}))
import { curriculumApi } from '../../src/api/curriculum'
const mockGet = curriculumApi.get as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => mockGet.mockReset())

test('fetches curriculum for given learnerId', async () => {
  const data = [{ id: 's1', name: 'Math', emoji: '🔢', chapters: [] }]
  mockGet.mockResolvedValue(data)
  const { result } = renderHook(() => useCurriculum('l1'), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(mockGet).toHaveBeenCalledWith('l1')
  expect(result.current.data).toEqual(data)
})

test('does not fetch when learnerId is null', async () => {
  const { result } = renderHook(() => useCurriculum(null), { wrapper })
  expect(result.current.fetchStatus).toBe('idle')
  expect(mockGet).not.toHaveBeenCalled()
})
```

```tsx
// __tests__/hooks/useLesson.test.tsx
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLesson } from '../../src/hooks/useLesson'

jest.mock('../../src/api/curriculum', () => ({
  curriculumApi: { getLesson: jest.fn() },
}))
import { curriculumApi } from '../../src/api/curriculum'
const mockGetLesson = curriculumApi.getLesson as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => mockGetLesson.mockReset())

test('fetches lesson detail', async () => {
  const lesson = { id: 'les1', title: 'Addition', exercises: [{ id: 'ex1', type: 'multiple_choice', prompt: '1+1=?', options: ['1','2','3','4'] }] }
  mockGetLesson.mockResolvedValue(lesson)
  const { result } = renderHook(() => useLesson('les1', 'l1'), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(mockGetLesson).toHaveBeenCalledWith('les1', 'l1')
  expect(result.current.data).toEqual(lesson)
})
```

```tsx
// __tests__/hooks/useQuiz.test.tsx
import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuiz } from '../../src/hooks/useQuiz'

jest.mock('../../src/api/curriculum', () => ({
  curriculumApi: { getQuiz: jest.fn() },
}))
import { curriculumApi } from '../../src/api/curriculum'
const mockGetQuiz = curriculumApi.getQuiz as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => mockGetQuiz.mockReset())

test('fetches quiz for given chapterId', async () => {
  const quiz = { generated: true, questions: [{ id: 'q1', prompt: 'What is 2+2?', options: ['3','4','5','6'] }] }
  mockGetQuiz.mockResolvedValue(quiz)
  const { result } = renderHook(() => useQuiz('ch1', 'l1'), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(mockGetQuiz).toHaveBeenCalledWith('ch1', 'l1')
  expect(result.current.data?.generated).toBe(true)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/hooks/useCurriculum.test.tsx __tests__/hooks/useLesson.test.tsx __tests__/hooks/useQuiz.test.tsx --no-coverage
```

Expected: FAIL — module not found errors

- [ ] **Step 3: Create the three hook files**

```ts
// src/hooks/useCurriculum.ts
import { useQuery } from '@tanstack/react-query'
import { curriculumApi } from '../api/curriculum'

export function useCurriculum(learnerId: string | null) {
  return useQuery({
    queryKey: ['curriculum', learnerId],
    queryFn: () => curriculumApi.get(learnerId!),
    enabled: learnerId != null,
  })
}
```

```ts
// src/hooks/useLesson.ts
import { useQuery } from '@tanstack/react-query'
import { curriculumApi } from '../api/curriculum'

export function useLesson(lessonId: string, learnerId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId, learnerId],
    queryFn: () => curriculumApi.getLesson(lessonId, learnerId),
  })
}
```

```ts
// src/hooks/useQuiz.ts
import { useQuery } from '@tanstack/react-query'
import { curriculumApi } from '../api/curriculum'

export function useQuiz(chapterId: string, learnerId: string) {
  return useQuery({
    queryKey: ['quiz', chapterId, learnerId],
    queryFn: () => curriculumApi.getQuiz(chapterId, learnerId),
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/hooks/useCurriculum.test.tsx __tests__/hooks/useLesson.test.tsx __tests__/hooks/useQuiz.test.tsx --no-coverage
```

Expected: PASS (4 tests total)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCurriculum.ts src/hooks/useLesson.ts src/hooks/useQuiz.ts \
  __tests__/hooks/useCurriculum.test.tsx __tests__/hooks/useLesson.test.tsx __tests__/hooks/useQuiz.test.tsx
git commit -m "feat: add useCurriculum, useLesson, useQuiz TanStack Query hooks"
```

---

## Task 3: LearnNavigator + Update ChildNavigator

**Files:**
- Create: `src/navigation/LearnNavigator.tsx`
- Modify: `src/navigation/ChildNavigator.tsx`

- [ ] **Step 1: Create `src/navigation/LearnNavigator.tsx`**

```tsx
// src/navigation/LearnNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LearnScreen } from '../screens/child/LearnScreen'
import { LessonScreen } from '../screens/child/LessonScreen'
import { QuizScreen } from '../screens/child/QuizScreen'

export type LearnStackParams = {
  LearnScreen: undefined
  LessonScreen: { lessonId: string; lessonTitle: string; chapterId: string }
  QuizScreen: { chapterId: string; chapterTitle: string; generated: boolean }
}

const Stack = createNativeStackNavigator<LearnStackParams>()

export function LearnNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LearnScreen" component={LearnScreen} />
      <Stack.Screen name="LessonScreen" component={LessonScreen} />
      <Stack.Screen name="QuizScreen" component={QuizScreen} />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 2: Update `src/navigation/ChildNavigator.tsx` to use `LearnNavigator`**

Replace the `LearnScreen` import and tab screen with `LearnNavigator`. Replace the full file contents:

```tsx
// src/navigation/ChildNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { HomeScreen } from '../screens/child/HomeScreen'
import { LearnNavigator, type LearnStackParams } from './LearnNavigator'
import { RanksScreen } from '../screens/child/RanksScreen'
import { ProfileScreen } from '../screens/child/ProfileScreen'
import { colors } from '../constants/theme'

export type ChildTabParams = {
  Home: undefined
  Learn: NavigatorScreenParams<LearnStackParams>
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
      <Tab.Screen name="Learn" component={LearnNavigator} />
      <Tab.Screen name="Ranks" component={RanksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 3: Create placeholder screens for LessonScreen and QuizScreen** (will be replaced in Tasks 5 and 6)

```tsx
// src/screens/child/LessonScreen.tsx
import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'
export function LessonScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>Lesson (Plan 3)</Text></View>
}
```

```tsx
// src/screens/child/QuizScreen.tsx
import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'
export function QuizScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>Quiz (Plan 3)</Text></View>
}
```

- [ ] **Step 4: Verify the app still starts**

```bash
npx expo start --clear
```

Expected: Metro starts, Learn tab now uses LearnNavigator stack internally. No red-screen errors.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/LearnNavigator.tsx src/navigation/ChildNavigator.tsx \
  src/screens/child/LessonScreen.tsx src/screens/child/QuizScreen.tsx
git commit -m "feat: add LearnNavigator stack, nest inside ChildNavigator Learn tab"
```

---

## Task 4: LearnScreen (Subjects / Chapters / Lessons List)

**Files:**
- Modify: `src/screens/child/LearnScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/LearnScreen.test.tsx`

**Design:** Shows each subject as a collapsible section. Tapping a subject expands it to show its chapters. Each chapter shows a list of lessons (locked = dimmed, completed = checkmark). A "Chapter Quiz" button appears below lessons in a chapter. Locked chapters/lessons show a lock emoji and are non-interactive.

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/LearnScreen.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { LearnScreen } from '../../src/screens/child/LearnScreen'

jest.mock('../../src/hooks/useCurriculum', () => ({ useCurriculum: jest.fn() }))
jest.mock('../../src/store/useAuthStore', () => ({ useAuthStore: jest.fn() }))
const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

import { useCurriculum } from '../../src/hooks/useCurriculum'
import { useAuthStore } from '../../src/store/useAuthStore'
const mockUseCurriculum = useCurriculum as jest.Mock
const mockUseAuthStore = useAuthStore as jest.Mock

const CURRICULUM = [
  {
    id: 's1', name: 'Math', emoji: '🔢',
    chapters: [
      {
        id: 'ch1', title: 'Chapter 1: Addition', order: 1, locked: false,
        quiz: { generated: true },
        lessons: [
          { id: 'les1', title: 'Lesson 1', order: 1, locked: false, completed: true },
          { id: 'les2', title: 'Lesson 2', order: 2, locked: false, completed: false },
        ],
      },
    ],
  },
  {
    id: 's2', name: 'Science', emoji: '🔬',
    chapters: [
      {
        id: 'ch2', title: 'Chapter 1: Plants', order: 1, locked: true,
        quiz: { generated: false },
        lessons: [
          { id: 'les3', title: 'Lesson 1', order: 1, locked: true, completed: false },
        ],
      },
    ],
  },
]

beforeEach(() => {
  mockNavigate.mockReset()
  mockUseCurriculum.mockReturnValue({ data: CURRICULUM, isLoading: false })
  mockUseAuthStore.mockReturnValue({ activeLearner: { id: 'l1', name: 'Emma', avatarEmoji: '🦋' } })
})

test('renders subject names', () => {
  const { getByText } = render(<LearnScreen />)
  expect(getByText('Math')).toBeTruthy()
  expect(getByText('Science')).toBeTruthy()
})

test('tapping a subject shows its chapters and lessons', () => {
  const { getByText } = render(<LearnScreen />)
  fireEvent.press(getByText('Math'))
  expect(getByText('Chapter 1: Addition')).toBeTruthy()
  expect(getByText('Lesson 1')).toBeTruthy()
  expect(getByText('Lesson 2')).toBeTruthy()
})

test('tapping an unlocked lesson navigates to LessonScreen', () => {
  const { getByText } = render(<LearnScreen />)
  fireEvent.press(getByText('Math'))
  fireEvent.press(getByText('Lesson 2'))
  expect(mockNavigate).toHaveBeenCalledWith('LessonScreen', {
    lessonId: 'les2',
    lessonTitle: 'Lesson 2',
    chapterId: 'ch1',
  })
})

test('tapping a locked lesson does not navigate', () => {
  const { getByText } = render(<LearnScreen />)
  fireEvent.press(getByText('Science'))
  fireEvent.press(getByText('Lesson 1'))
  expect(mockNavigate).not.toHaveBeenCalled()
})

test('shows Chapter Quiz button when quiz is generated', () => {
  const { getByText } = render(<LearnScreen />)
  fireEvent.press(getByText('Math'))
  expect(getByText('Chapter Quiz')).toBeTruthy()
})

test('tapping Chapter Quiz navigates to QuizScreen with generated=true', () => {
  const { getByText } = render(<LearnScreen />)
  fireEvent.press(getByText('Math'))
  fireEvent.press(getByText('Chapter Quiz'))
  expect(mockNavigate).toHaveBeenCalledWith('QuizScreen', {
    chapterId: 'ch1',
    chapterTitle: 'Chapter 1: Addition',
    generated: true,
  })
})

test('shows loading indicator while data is loading', () => {
  mockUseCurriculum.mockReturnValue({ data: undefined, isLoading: true })
  const { getByTestId } = render(<LearnScreen />)
  expect(getByTestId('loading-indicator')).toBeTruthy()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/LearnScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/child/LearnScreen.tsx`**

```tsx
// src/screens/child/LearnScreen.tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { LearnStackParams } from '../../navigation/LearnNavigator'
import { useAuthStore } from '../../store/useAuthStore'
import { useCurriculum } from '../../hooks/useCurriculum'
import { colors } from '../../constants/theme'
import type { ChapterSummary } from '../../api/curriculum'

type Nav = NativeStackNavigationProp<LearnStackParams, 'LearnScreen'>

export function LearnScreen() {
  const { navigate } = useNavigation<Nav>()
  const { activeLearner } = useAuthStore()
  const { data: curriculum, isLoading } = useCurriculum(activeLearner?.id ?? null)
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <View testID="loading-indicator" style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  function handleLessonPress(chapter: ChapterSummary, lessonId: string, lessonTitle: string, locked: boolean) {
    if (locked) return
    navigate('LessonScreen', { lessonId, lessonTitle, chapterId: chapter.id })
  }

  function handleQuizPress(chapter: ChapterSummary) {
    navigate('QuizScreen', {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      generated: chapter.quiz.generated,
    })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 20 }}>
          Learn
        </Text>

        {curriculum?.map((subject) => {
          const isExpanded = expandedSubjectId === subject.id
          return (
            <View key={subject.id} style={{ marginBottom: 16 }}>
              {/* Subject Header */}
              <TouchableOpacity
                onPress={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                style={{
                  backgroundColor: colors.bgCard, borderRadius: 16, padding: 16,
                  flexDirection: 'row', alignItems: 'center',
                  borderWidth: 1, borderColor: colors.border,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>{subject.emoji}</Text>
                <Text style={{ flex: 1, fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: colors.textPrimary }}>
                  {subject.name}
                </Text>
                <Text style={{ fontSize: 18, color: colors.textMuted }}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {/* Chapters + Lessons */}
              {isExpanded && subject.chapters.map((chapter) => (
                <View key={chapter.id} style={{ marginTop: 8, marginLeft: 16 }}>
                  {/* Chapter Title */}
                  <Text style={{
                    fontSize: 14, fontFamily: 'Nunito_700Bold',
                    color: chapter.locked ? colors.textMuted : colors.textSecondary,
                    marginBottom: 6, marginTop: 4,
                  }}>
                    {chapter.locked ? '🔒 ' : ''}{chapter.title}
                  </Text>

                  {/* Lessons */}
                  {chapter.lessons.map((lesson) => (
                    <TouchableOpacity
                      key={lesson.id}
                      onPress={() => handleLessonPress(chapter, lesson.id, lesson.title, lesson.locked)}
                      style={{
                        backgroundColor: colors.bgCard, borderRadius: 12, padding: 14,
                        flexDirection: 'row', alignItems: 'center',
                        borderWidth: 1, borderColor: colors.border,
                        marginBottom: 8,
                        opacity: lesson.locked ? 0.5 : 1,
                      }}
                      activeOpacity={lesson.locked ? 1 : 0.8}
                    >
                      <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: colors.textPrimary }}>
                        {lesson.locked ? '🔒 ' : ''}{lesson.title}
                      </Text>
                      {lesson.completed && (
                        <Text style={{ fontSize: 16, color: colors.success }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}

                  {/* Chapter Quiz */}
                  {!chapter.locked && (
                    <TouchableOpacity
                      onPress={() => handleQuizPress(chapter)}
                      style={{
                        backgroundColor: colors.star + '22', borderRadius: 12, padding: 14,
                        flexDirection: 'row', alignItems: 'center',
                        borderWidth: 1, borderColor: colors.star + '44',
                        marginBottom: 8,
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 16, marginRight: 8 }}>⭐</Text>
                      <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Nunito_700Bold', color: colors.star }}>
                        Chapter Quiz
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/LearnScreen.test.tsx --no-coverage
```

Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/child/LearnScreen.tsx __tests__/screens/LearnScreen.test.tsx
git commit -m "feat: add LearnScreen with subject/chapter/lesson list and quiz navigation"
```

---

## Task 5: LessonScreen (Exercise Player)

**Files:**
- Modify: `src/screens/child/LessonScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/LessonScreen.test.tsx`

**Design:** One exercise at a time. Progress indicator (e.g., "2 / 5"). For `multiple_choice`: tap an option to select it, "Check" button appears, shows green/red feedback, then "Next" button. For `true_false`: two large buttons ("True" / "False"). For `fill_blank`: TextInput + "Check" button. After the last exercise, calls `submitProgress` and shows a completion card.

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/LessonScreen.test.tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { LessonScreen } from '../../src/screens/child/LessonScreen'

jest.mock('../../src/hooks/useLesson', () => ({ useLesson: jest.fn() }))
jest.mock('../../src/store/useAuthStore', () => ({ useAuthStore: jest.fn() }))
jest.mock('../../src/api/curriculum', () => ({
  curriculumApi: { checkAnswer: jest.fn(), submitProgress: jest.fn() },
}))

const mockGoBack = jest.fn()
const mockGetParam = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({ params: { lessonId: 'les1', lessonTitle: 'Addition Basics', chapterId: 'ch1' } }),
}))

import { useLesson } from '../../src/hooks/useLesson'
import { useAuthStore } from '../../src/store/useAuthStore'
import { curriculumApi } from '../../src/api/curriculum'
const mockUseLesson = useLesson as jest.Mock
const mockUseAuthStore = useAuthStore as jest.Mock
const mockCheckAnswer = curriculumApi.checkAnswer as jest.Mock
const mockSubmitProgress = curriculumApi.submitProgress as jest.Mock

const EXERCISES = [
  { id: 'ex1', type: 'multiple_choice' as const, prompt: 'What is 1+1?', options: ['1', '2', '3', '4'] },
  { id: 'ex2', type: 'true_false' as const, prompt: 'The sky is blue.', options: null },
]

beforeEach(() => {
  mockGoBack.mockReset()
  mockCheckAnswer.mockReset()
  mockSubmitProgress.mockReset()
  mockUseLesson.mockReturnValue({ data: { id: 'les1', title: 'Addition Basics', exercises: EXERCISES }, isLoading: false })
  mockUseAuthStore.mockReturnValue({ activeLearner: { id: 'l1', name: 'Emma', avatarEmoji: '🦋' } })
})

test('renders lesson title and first exercise prompt', () => {
  const { getByText } = render(<LessonScreen />)
  expect(getByText('Addition Basics')).toBeTruthy()
  expect(getByText('What is 1+1?')).toBeTruthy()
})

test('renders multiple choice options', () => {
  const { getByText } = render(<LessonScreen />)
  expect(getByText('1')).toBeTruthy()
  expect(getByText('2')).toBeTruthy()
  expect(getByText('3')).toBeTruthy()
  expect(getByText('4')).toBeTruthy()
})

test('tapping an option and pressing Check calls checkAnswer', async () => {
  mockCheckAnswer.mockResolvedValue({ correct: true })
  const { getByText } = render(<LessonScreen />)
  fireEvent.press(getByText('2'))
  fireEvent.press(getByText('Check'))
  await waitFor(() => expect(mockCheckAnswer).toHaveBeenCalledWith('les1', {
    learner_id: 'l1', exercise_id: 'ex1', answer: '2',
  }))
})

test('shows correct feedback after correct answer', async () => {
  mockCheckAnswer.mockResolvedValue({ correct: true })
  const { getByText } = render(<LessonScreen />)
  fireEvent.press(getByText('2'))
  fireEvent.press(getByText('Check'))
  await waitFor(() => expect(getByText(/correct/i)).toBeTruthy())
})

test('shows incorrect feedback after wrong answer', async () => {
  mockCheckAnswer.mockResolvedValue({ correct: false })
  const { getByText } = render(<LessonScreen />)
  fireEvent.press(getByText('1'))
  fireEvent.press(getByText('Check'))
  await waitFor(() => expect(getByText(/try again/i)).toBeTruthy())
})

test('after last exercise, calls submitProgress and shows completion card', async () => {
  mockUseLesson.mockReturnValue({
    data: { id: 'les1', title: 'Addition Basics', exercises: [EXERCISES[0]] },
    isLoading: false,
  })
  mockCheckAnswer.mockResolvedValue({ correct: true })
  mockSubmitProgress.mockResolvedValue({ completed: true })
  const { getByText } = render(<LessonScreen />)
  fireEvent.press(getByText('2'))
  fireEvent.press(getByText('Check'))
  await waitFor(() => getByText(/next/i))
  fireEvent.press(getByText(/next/i))
  await waitFor(() => {
    expect(mockSubmitProgress).toHaveBeenCalledWith('les1', { learner_id: 'l1', exercise_ids: ['ex1'] })
    expect(getByText(/lesson complete/i)).toBeTruthy()
  })
})

test('shows loading indicator while lesson is loading', () => {
  mockUseLesson.mockReturnValue({ data: undefined, isLoading: true })
  const { getByTestId } = render(<LessonScreen />)
  expect(getByTestId('loading-indicator')).toBeTruthy()
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/LessonScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/child/LessonScreen.tsx`**

```tsx
// src/screens/child/LessonScreen.tsx
import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  ScrollView, TextInput, StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack'
import type { LearnStackParams } from '../../navigation/LearnNavigator'
import { useAuthStore } from '../../store/useAuthStore'
import { useLesson } from '../../hooks/useLesson'
import { curriculumApi } from '../../api/curriculum'
import { colors } from '../../constants/theme'

type Nav = NativeStackNavigationProp<LearnStackParams, 'LessonScreen'>
type Route = RouteProp<LearnStackParams, 'LessonScreen'>

export function LessonScreen() {
  const { goBack } = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { activeLearner } = useAuthStore()
  const { data: lesson, isLoading } = useLesson(params.lessonId, activeLearner?.id ?? '')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [fillAnswer, setFillAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [checking, setChecking] = useState(false)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) {
    return (
      <View testID="loading-indicator" style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
        <Text style={{ fontSize: 26, fontFamily: 'Nunito_900Black', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
          Lesson Complete!
        </Text>
        <Text style={{ fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: colors.textSecondary, marginBottom: 32, textAlign: 'center' }}>
          Great work, {activeLearner?.name}!
        </Text>
        <TouchableOpacity
          onPress={goBack}
          style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40 }}
        >
          <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>Back to Lessons</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const exercises = lesson?.exercises ?? []
  const exercise = exercises[currentIndex]
  const isLast = currentIndex === exercises.length - 1

  async function handleCheck() {
    if (!exercise || !activeLearner) return
    const answer = exercise.type === 'fill_blank' ? fillAnswer : (selectedAnswer ?? '')
    if (!answer) return
    setChecking(true)
    try {
      const result = await curriculumApi.checkAnswer(params.lessonId, {
        learner_id: activeLearner.id,
        exercise_id: exercise.id,
        answer,
      })
      setFeedback(result.correct ? 'correct' : 'incorrect')
    } finally {
      setChecking(false)
    }
  }

  async function handleNext() {
    setFeedback(null)
    setSelectedAnswer(null)
    setFillAnswer('')
    if (isLast) {
      setSubmitting(true)
      try {
        await curriculumApi.submitProgress(params.lessonId, {
          learner_id: activeLearner?.id ?? '',
          exercise_ids: exercises.map((e) => e.id),
        })
      } finally {
        setSubmitting(false)
        setDone(true)
      }
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const canCheck = exercise?.type === 'fill_blank' ? fillAnswer.trim().length > 0 : selectedAnswer != null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0 }}>
        <TouchableOpacity onPress={goBack} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 24, color: colors.textMuted }}>←</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 16, fontFamily: 'Nunito_700Bold', color: colors.textPrimary }}>
          {lesson?.title}
        </Text>
        <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>
          {currentIndex + 1} / {exercises.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: colors.border, marginHorizontal: 20, marginTop: 12, borderRadius: 2 }}>
        <View style={{
          height: 4, borderRadius: 2, backgroundColor: colors.primary,
          width: `${((currentIndex + 1) / exercises.length) * 100}%`,
        }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        {/* Prompt */}
        <View style={{
          backgroundColor: colors.bgCard, borderRadius: 16, padding: 20,
          marginBottom: 24, borderWidth: 1, borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 18, fontFamily: 'Nunito_700Bold', color: colors.textPrimary, lineHeight: 26 }}>
            {exercise?.prompt}
          </Text>
        </View>

        {/* Multiple Choice */}
        {exercise?.type === 'multiple_choice' && exercise.options?.map((option) => {
          const isSelected = selectedAnswer === option
          const bgColor = feedback
            ? isSelected
              ? feedback === 'correct' ? colors.success + '33' : colors.error + '33'
              : colors.bgCard
            : isSelected ? colors.primary + '33' : colors.bgCard
          const borderColor = feedback
            ? isSelected
              ? feedback === 'correct' ? colors.success : colors.error
              : colors.border
            : isSelected ? colors.primary : colors.border
          return (
            <TouchableOpacity
              key={option}
              onPress={() => { if (!feedback) setSelectedAnswer(option) }}
              style={{
                backgroundColor: bgColor, borderRadius: 12, padding: 16,
                marginBottom: 10, borderWidth: 2, borderColor,
              }}
              activeOpacity={feedback ? 1 : 0.8}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Nunito_600SemiBold', color: colors.textPrimary }}>
                {option}
              </Text>
            </TouchableOpacity>
          )
        })}

        {/* True / False */}
        {exercise?.type === 'true_false' && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['True', 'False'].map((option) => {
              const isSelected = selectedAnswer === option
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => { if (!feedback) setSelectedAnswer(option) }}
                  style={{
                    flex: 1, backgroundColor: isSelected ? colors.primary + '33' : colors.bgCard,
                    borderRadius: 12, padding: 20, alignItems: 'center',
                    borderWidth: 2, borderColor: isSelected ? colors.primary : colors.border,
                  }}
                  activeOpacity={feedback ? 1 : 0.8}
                >
                  <Text style={{ fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: colors.textPrimary }}>
                    {option}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Fill in the Blank */}
        {exercise?.type === 'fill_blank' && (
          <TextInput
            value={fillAnswer}
            onChangeText={setFillAnswer}
            placeholder="Your answer..."
            placeholderTextColor={colors.textMuted}
            editable={!feedback}
            style={{
              backgroundColor: colors.bgCard, borderRadius: 12, padding: 16,
              color: colors.textPrimary, fontFamily: 'Nunito_600SemiBold', fontSize: 16,
              borderWidth: 1, borderColor: colors.border,
            }}
          />
        )}

        {/* Feedback */}
        {feedback && (
          <View style={{
            backgroundColor: feedback === 'correct' ? colors.success + '22' : colors.error + '22',
            borderRadius: 12, padding: 16, marginTop: 16,
            borderWidth: 1, borderColor: feedback === 'correct' ? colors.success : colors.error,
          }}>
            <Text style={{
              fontSize: 15, fontFamily: 'Nunito_700Bold',
              color: feedback === 'correct' ? colors.success : colors.error,
            }}>
              {feedback === 'correct' ? '✓ Correct!' : '✗ Try again next time!'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={{ padding: 20 }}>
        {!feedback ? (
          <TouchableOpacity
            onPress={handleCheck}
            disabled={!canCheck || checking}
            style={{
              backgroundColor: canCheck ? colors.primary : colors.border,
              borderRadius: 16, paddingVertical: 16, alignItems: 'center',
              opacity: checking ? 0.7 : 1,
            }}
            activeOpacity={0.85}
          >
            {checking
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>Check</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            disabled={submitting}
            style={{
              backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16,
              alignItems: 'center', opacity: submitting ? 0.7 : 1,
            }}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>
                  {isLast ? 'Finish Lesson' : 'Next'}
                </Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/LessonScreen.test.tsx --no-coverage
```

Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/screens/child/LessonScreen.tsx __tests__/screens/LessonScreen.test.tsx
git commit -m "feat: add LessonScreen exercise player with per-exercise answer checking and progress submission"
```

---

## Task 6: QuizScreen (Chapter Quiz)

**Files:**
- Modify: `src/screens/child/QuizScreen.tsx` (replace placeholder)
- Create: `__tests__/screens/QuizScreen.test.tsx`

**Design:** If `generated: false` → show "Coming Soon" card with a back button. If `generated: true` → show all questions one at a time with options (same look as LessonScreen multiple choice). Submit all answers at the end → show result with `effective_stars` (always use this, not `stars_earned`).

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/screens/QuizScreen.test.tsx
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { QuizScreen } from '../../src/screens/child/QuizScreen'

jest.mock('../../src/hooks/useQuiz', () => ({ useQuiz: jest.fn() }))
jest.mock('../../src/store/useAuthStore', () => ({ useAuthStore: jest.fn() }))
jest.mock('../../src/api/curriculum', () => ({
  curriculumApi: { submitQuiz: jest.fn() },
}))

const mockGoBack = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({
    params: { chapterId: 'ch1', chapterTitle: 'Chapter 1: Addition', generated: true },
  }),
}))

import { useQuiz } from '../../src/hooks/useQuiz'
import { useAuthStore } from '../../src/store/useAuthStore'
import { curriculumApi } from '../../src/api/curriculum'
const mockUseQuiz = useQuiz as jest.Mock
const mockUseAuthStore = useAuthStore as jest.Mock
const mockSubmitQuiz = curriculumApi.submitQuiz as jest.Mock

const QUESTIONS = [
  { id: 'q1', prompt: 'What is 2+2?', options: ['3', '4', '5', '6'] },
  { id: 'q2', prompt: 'What is 3+1?', options: ['3', '4', '5', '6'] },
]

beforeEach(() => {
  mockGoBack.mockReset()
  mockSubmitQuiz.mockReset()
  mockUseQuiz.mockReturnValue({ data: { generated: true, questions: QUESTIONS }, isLoading: false })
  mockUseAuthStore.mockReturnValue({ activeLearner: { id: 'l1', name: 'Emma', avatarEmoji: '🦋' } })
})

test('renders chapter title', () => {
  const { getByText } = render(<QuizScreen />)
  expect(getByText('Chapter 1: Addition')).toBeTruthy()
})

test('renders first question prompt and options', () => {
  const { getByText } = render(<QuizScreen />)
  expect(getByText('What is 2+2?')).toBeTruthy()
  expect(getByText('4')).toBeTruthy()
})

test('shows coming soon when generated is false', () => {
  mockUseQuiz.mockReturnValue({ data: { generated: false, questions: [] }, isLoading: false })
  const { getByText } = render(<QuizScreen />)
  expect(getByText(/coming soon/i)).toBeTruthy()
})

test('advances to next question after selecting an answer and pressing Next', () => {
  const { getByText } = render(<QuizScreen />)
  fireEvent.press(getByText('4'))
  fireEvent.press(getByText('Next'))
  expect(getByText('What is 3+1?')).toBeTruthy()
})

test('submits quiz with all answers and shows effective_stars', async () => {
  mockSubmitQuiz.mockResolvedValue({ passed: true, stars_earned: 2, effective_stars: 3, score: 100 })
  const { getByText } = render(<QuizScreen />)
  fireEvent.press(getByText('4'))
  fireEvent.press(getByText('Next'))
  fireEvent.press(getByText('4'))
  fireEvent.press(getByText('Submit Quiz'))
  await waitFor(() => {
    expect(mockSubmitQuiz).toHaveBeenCalledWith('ch1', {
      learner_id: 'l1',
      answers: [
        { question_id: 'q1', answer: '4' },
        { question_id: 'q2', answer: '4' },
      ],
    })
    expect(getByText('3')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/screens/QuizScreen.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Replace `src/screens/child/QuizScreen.tsx`**

```tsx
// src/screens/child/QuizScreen.tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack'
import type { LearnStackParams } from '../../navigation/LearnNavigator'
import { useAuthStore } from '../../store/useAuthStore'
import { useQuiz } from '../../hooks/useQuiz'
import { curriculumApi, type QuizSubmitResponse } from '../../api/curriculum'
import { colors } from '../../constants/theme'

type Nav = NativeStackNavigationProp<LearnStackParams, 'QuizScreen'>
type Route = RouteProp<LearnStackParams, 'QuizScreen'>

export function QuizScreen() {
  const { goBack } = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { activeLearner } = useAuthStore()
  const { data: quiz, isLoading } = useQuiz(params.chapterId, activeLearner?.id ?? '')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [result, setResult] = useState<QuizSubmitResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  if (!params.generated || !quiz?.generated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🚧</Text>
        <Text style={{ fontSize: 22, fontFamily: 'Nunito_900Black', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 }}>
          Coming Soon
        </Text>
        <Text style={{ fontSize: 15, fontFamily: 'Nunito_400Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }}>
          The chapter quiz for {params.chapterTitle} is being generated.
        </Text>
        <TouchableOpacity onPress={goBack} style={{ backgroundColor: colors.bgCard, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32 }}>
          <Text style={{ color: colors.textPrimary, fontFamily: 'Nunito_700Bold', fontSize: 15 }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>{result.passed ? '🏆' : '💪'}</Text>
        <Text style={{ fontSize: 26, fontFamily: 'Nunito_900Black', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 }}>
          {result.passed ? 'Quiz Passed!' : 'Keep Practising!'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Text key={i} style={{ fontSize: 36, color: i < result.effective_stars ? colors.star : colors.border }}>★</Text>
          ))}
        </View>
        <Text style={{ fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: colors.textSecondary, marginBottom: 8 }}>
          Stars earned: {result.effective_stars}
        </Text>
        <TouchableOpacity
          onPress={goBack}
          style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, marginTop: 16 }}
        >
          <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const questions = quiz.questions
  const question = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  async function handleNext() {
    if (!selectedAnswer || !question) return
    const updatedAnswers = { ...answers, [question.id]: selectedAnswer }
    setAnswers(updatedAnswers)
    setSelectedAnswer(null)
    if (isLast) {
      setSubmitting(true)
      try {
        const res = await curriculumApi.submitQuiz(params.chapterId, {
          learner_id: activeLearner?.id ?? '',
          answers: Object.entries(updatedAnswers).map(([question_id, answer]) => ({ question_id, answer })),
        })
        setResult(res)
      } finally {
        setSubmitting(false)
      }
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0 }}>
        <TouchableOpacity onPress={goBack} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 24, color: colors.textMuted }}>←</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 16, fontFamily: 'Nunito_700Bold', color: colors.textPrimary }}>
          {params.chapterTitle}
        </Text>
        <Text style={{ fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: colors.textMuted }}>
          {currentIndex + 1} / {questions.length}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: colors.border, marginHorizontal: 20, marginTop: 12, borderRadius: 2 }}>
        <View style={{
          height: 4, borderRadius: 2, backgroundColor: colors.star,
          width: `${((currentIndex + 1) / questions.length) * 100}%`,
        }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        {/* Prompt */}
        <View style={{
          backgroundColor: colors.bgCard, borderRadius: 16, padding: 20,
          marginBottom: 24, borderWidth: 1, borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 18, fontFamily: 'Nunito_700Bold', color: colors.textPrimary, lineHeight: 26 }}>
            {question?.prompt}
          </Text>
        </View>

        {/* Options */}
        {question?.options.map((option) => {
          const isSelected = selectedAnswer === option
          return (
            <TouchableOpacity
              key={option}
              onPress={() => setSelectedAnswer(option)}
              style={{
                backgroundColor: isSelected ? colors.star + '33' : colors.bgCard,
                borderRadius: 12, padding: 16, marginBottom: 10,
                borderWidth: 2, borderColor: isSelected ? colors.star : colors.border,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16, fontFamily: 'Nunito_600SemiBold', color: colors.textPrimary }}>
                {option}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Action */}
      <View style={{ padding: 20 }}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!selectedAnswer || submitting}
          style={{
            backgroundColor: selectedAnswer ? colors.primary : colors.border,
            borderRadius: 16, paddingVertical: 16, alignItems: 'center',
            opacity: submitting ? 0.7 : 1,
          }}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 16 }}>
                {isLast ? 'Submit Quiz' : 'Next'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/QuizScreen.test.tsx --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/screens/child/QuizScreen.tsx __tests__/screens/QuizScreen.test.tsx
git commit -m "feat: add QuizScreen with generated guard, per-question flow, and effective_stars result"
```

---

## Plan 3 Complete

At this point the app has:
- Full curriculum API (get, getLesson, checkAnswer, submitProgress, getQuiz, submitQuiz)
- Three TanStack Query hooks: `useCurriculum`, `useLesson`, `useQuiz`
- `LearnNavigator` stack nested in the Learn tab
- `LearnScreen` with expandable subjects/chapters/lessons
- `LessonScreen` exercise player (multiple choice, true/false, fill blank) with per-exercise checking
- `QuizScreen` with `generated` guard, per-question flow, and `effective_stars` display

**Next:** Plan 4 — Ranks + Profile + Settings
