import { act } from '@testing-library/react-native'
import { useAuthStore } from '../../src/store/useAuthStore'

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
