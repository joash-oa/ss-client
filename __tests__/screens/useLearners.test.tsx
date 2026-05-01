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
