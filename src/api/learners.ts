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

  get: (id: string) =>
    apiRequest<Learner>(`/learners/${id}`),

  create: (body: { name: string; age: number; grade_level: number; avatar_emoji: string }) =>
    apiRequest<Learner>('/learners', { method: 'POST', body }),
}
