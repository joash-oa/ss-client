import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { RegisterScreen } from '../../src/screens/auth/RegisterScreen'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../src/api/auth', () => ({ authApi: { register: jest.fn() } }))
jest.mock('../../src/api/learners', () => ({ learnersApi: { create: jest.fn() } }))
jest.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({
    setTokens: jest.fn().mockResolvedValue(undefined),
    setActiveLearner: jest.fn(),
  }),
}))

import { authApi } from '../../src/api/auth'
import { learnersApi } from '../../src/api/learners'
const mockRegister = authApi.register as jest.Mock
const mockCreate = learnersApi.create as jest.Mock

beforeEach(() => {
  mockNavigate.mockReset()
  mockRegister.mockReset()
  mockCreate.mockReset()
})

test('renders step 1 fields initially', () => {
  const { getByPlaceholderText } = render(<RegisterScreen />)
  expect(getByPlaceholderText(/email/i)).toBeTruthy()
  expect(getByPlaceholderText(/password/i)).toBeTruthy()
})

test('shows error and stays on step 1 when fields empty', async () => {
  const { getByText } = render(<RegisterScreen />)
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/required/i)).toBeTruthy())
})

test('advances to step 2 (PIN) after valid step 1 input', async () => {
  const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'password123')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/4-digit PIN/i)).toBeTruthy())
})

test('advances to step 3 (learner) after valid PIN', async () => {
  const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'password123')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/4-digit PIN/i)).toBeTruthy())
  fireEvent.changeText(getByPlaceholderText(/PIN/i), '1234')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/Add your first learner/i)).toBeTruthy())
})

test('calls register then learner create on final submit', async () => {
  mockRegister.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref' })
  mockCreate.mockResolvedValue({ id: 'l1', name: 'Emma', avatar_emoji: '🦋' })

  const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'password123')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/4-digit PIN/i)).toBeTruthy())
  fireEvent.changeText(getByPlaceholderText(/PIN/i), '1234')
  fireEvent.press(getByText(/Next/i))
  await waitFor(() => expect(getByText(/Add your first learner/i)).toBeTruthy())
  fireEvent.changeText(getByPlaceholderText(/Learner's name/i), 'Emma')
  fireEvent.press(getByText(/Create Account/i))
  await waitFor(() => {
    expect(mockRegister).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123', pin: '1234' })
    expect(mockCreate).toHaveBeenCalled()
  })
})
