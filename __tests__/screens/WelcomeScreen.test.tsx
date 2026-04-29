import { render, fireEvent } from '@testing-library/react-native'
import { WelcomeScreen } from '../../src/screens/auth/WelcomeScreen'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))

beforeEach(() => mockNavigate.mockReset())

test('renders app name, subject chips, and fun message', () => {
  const { getByText } = render(<WelcomeScreen />)
  expect(getByText('Smarty Steps')).toBeTruthy()
  expect(getByText('Math')).toBeTruthy()
  expect(getByText('Science')).toBeTruthy()
  expect(getByText('English')).toBeTruthy()
  expect(getByText(/Your adventure starts here!/i)).toBeTruthy()
})

test('Get Started button navigates to Register', () => {
  const { getByText } = render(<WelcomeScreen />)
  fireEvent.press(getByText(/Get Started/i))
  expect(mockNavigate).toHaveBeenCalledWith('Register')
})

test('Sign In button navigates to Login', () => {
  const { getByText } = render(<WelcomeScreen />)
  fireEvent.press(getByText(/Sign In/i))
  expect(mockNavigate).toHaveBeenCalledWith('Login')
})
