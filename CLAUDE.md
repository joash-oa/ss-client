# Smarty Steps Client

Frontend for Smarty Steps, a learning app for 5–8 year olds covering Math, Science, and English.

## Rules

- Keep context window usage under 60%. Use `/compact` or suggest starting a new conversation before reaching that threshold.
- Always invoke the `superpowers:using-superpowers` skill at the start of every new conversation.
- Always invoke the `superpowers:test-driven-development` skill before writing any implementation code.
- Always separate concerns into three layers: **Screens (UI only)** → **Hooks/API (data fetching)** → **Store (global state)**. No direct API calls in screens. No UI logic in the store.
- Each task from an implementation plan gets its own branch (e.g. `feat/task-1-expo-init`). Never bundle multiple tasks onto one branch.
- Each phase gets its own stacked PR. Tasks within a phase are stacked on each other; the phase PR is stacked on the previous phase's PR.
- After every task is completed, run a `superpowers:code-reviewer` review before moving to the next task.
- All variables and functions must have descriptive, readable names that clearly convey their purpose. No single-letter names, abbreviations, or ambiguous shorthands (e.g. use `learnerId` not `lid`, `getByParentId` not `getBp`).

## Project Structure

```
src/
  screens/        # React Native screens — UI only, no API calls
    auth/         # WelcomeScreen, LoginScreen, RegisterScreen
    child/        # HomeScreen, LearnScreen, LessonScreen, RanksScreen, ProfileScreen, SettingsScreen
    parent/       # PINScreen, ParentDashboardScreen
  navigation/     # React Navigation navigators (Root, Auth, Child, Parent)
  api/            # Typed fetch wrappers per resource (auth, learners, curriculum, progress, leaderboard)
  store/          # Zustand stores (useAuthStore)
  hooks/          # TanStack Query hooks (useLearners, useCurriculum, useLesson, etc.)
  constants/      # theme.ts (colors, fonts, radius)
__tests__/
  screens/        # React Native Testing Library tests
  store/          # Zustand store unit tests
  api/            # API function unit tests (mocked fetch)
```

## Stack

- React Native + Expo SDK 52
- React Navigation 6 (native-stack + bottom-tabs)
- NativeWind 4 (Tailwind CSS for React Native)
- Zustand 5 — global state (auth tokens, active learner)
- TanStack Query 5 — server state (lessons, progress, leaderboard)
- Expo SecureStore — token persistence
- @expo-google-fonts/nunito — Nunito font family
- Jest + React Native Testing Library

## Key Design Decisions

- **Auth**: Parent Cognito JWT stored in Expo SecureStore via Zustand. `RootNavigator` switches between `AuthNavigator` and `ChildNavigator` based on `accessToken` presence.
- **Learner context**: No separate learner login — parent JWT + `learner_id` (from `activeLearner` in store) is the pattern for all learner API calls.
- **Server-side locking**: Use the `locked` field from the API directly. Never recompute lock state client-side.
- **Exercise answers**: Never assume correct answers are in lesson/quiz responses — they are stripped server-side. `check-answer` is per-exercise and stateless; `progress` submission requires all exercise IDs.
- **Chapter quiz guard**: Always check `generated` field before routing to a quiz. Show "coming soon" if `generated: false`.
- **Effective stars**: Always display `effective_stars` from quiz submit response, not raw `stars_earned`.
- **Parent Dashboard**: PIN-gated via `POST /parent/verify-pin` → short-lived token (separate from Cognito JWT). Never stored in the main auth store.

## Design Spec

Full spec: `docs/superpowers/specs/` (to be created)

## Implementation Plans

- Plan 1 (Setup + Auth): `docs/superpowers/plans/2026-04-28-plan1-setup-auth.md`
- Plan 2 (Dashboard): `docs/superpowers/plans/2026-04-28-plan2-dashboard.md`
- Plan 3 (Learn + Lesson): `docs/superpowers/plans/2026-04-28-plan3-learn-lesson.md`
- Plan 4 (Ranks + Profile + Settings): `docs/superpowers/plans/2026-04-28-plan4-ranks-profile-settings.md`
- Plan 5 (Parent Dashboard): `docs/superpowers/plans/2026-04-28-plan5-parent-dashboard.md`
