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
