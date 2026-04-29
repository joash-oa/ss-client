import { learnersApi } from '../../src/api/learners'

jest.mock('../../src/api/client', () => ({
  apiRequest: jest.fn(),
}))

import { apiRequest } from '../../src/api/client'

const mockApiRequest = apiRequest as jest.Mock

beforeEach(() => mockApiRequest.mockReset())

test('list calls GET /learners with auth', async () => {
  mockApiRequest.mockResolvedValue([])
  await learnersApi.list()
  expect(mockApiRequest).toHaveBeenCalledWith('/learners')
})

test('create calls POST /learners with auth and body', async () => {
  const body = { name: 'Emma', age: 6, grade_level: 1, avatar_emoji: '🦋' }
  mockApiRequest.mockResolvedValue({ id: 'l1', ...body })
  await learnersApi.create(body)
  expect(mockApiRequest).toHaveBeenCalledWith('/learners', { method: 'POST', body })
})
