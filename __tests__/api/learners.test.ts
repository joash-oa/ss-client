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
