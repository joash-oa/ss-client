import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { LoginScreen } from '../../src/screens/auth/LoginScreen'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

jest.mock('../../src/api/auth', () => ({
  authApi: { login: jest.fn() },
}))

jest.mock('../../src/store/useAuthStore', () => ({
  useAuthStore: () => ({ setTokens: jest.fn() }),
}))

import { authApi } from '../../src/api/auth'
const mockLogin = authApi.login as jest.Mock

beforeEach(() => {
  mockNavigate.mockReset()
  mockLogin.mockReset()
})

test('renders email and password inputs', () => {
  const { getByPlaceholderText } = render(<LoginScreen />)
  expect(getByPlaceholderText(/email/i)).toBeTruthy()
  expect(getByPlaceholderText(/password/i)).toBeTruthy()
})

test('shows error when fields are empty and Sign In pressed', async () => {
  const { getByText } = render(<LoginScreen />)
  fireEvent.press(getByText(/Sign In/i))
  await waitFor(() => expect(getByText(/required/i)).toBeTruthy())
})

test('calls authApi.login with trimmed email on submit', async () => {
  mockLogin.mockResolvedValue({ access_token: 'acc', refresh_token: 'ref' })
  const { getByPlaceholderText, getByText } = render(<LoginScreen />)
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'password123')
  fireEvent.press(getByText(/Sign In/i))
  await waitFor(() =>
    expect(mockLogin).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password123' })
  )
})

test('shows error message on login failure', async () => {
  mockLogin.mockRejectedValue(new Error('Invalid credentials'))
  const { getByPlaceholderText, getByText } = render(<LoginScreen />)
  fireEvent.changeText(getByPlaceholderText(/email/i), 'a@b.com')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'wrong')
  fireEvent.press(getByText(/Sign In/i))
  await waitFor(() => expect(getByText('Invalid credentials')).toBeTruthy())
})
