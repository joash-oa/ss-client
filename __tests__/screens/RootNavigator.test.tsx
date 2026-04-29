import React from 'react'
import { render } from '@testing-library/react-native'
import { useAuthStore } from '../../src/store/useAuthStore'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
}))

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigation: () => ({ navigate: jest.fn() }),
}))

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: ({ component: Component }: { component: React.ComponentType }) => <Component />,
  }),
}))

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Screen: ({ component: Component }: { component: React.ComponentType }) => <Component />,
  }),
}))

beforeEach(() => {
  useAuthStore.setState({ accessToken: null, refreshToken: null, activeLearner: null })
})

import { RootNavigator } from '../../src/navigation/RootNavigator'

test('renders Auth stack when no token', () => {
  const { getByText } = render(<RootNavigator />)
  expect(getByText('Smarty Steps')).toBeTruthy()
})

test('renders Child stack when token is present', () => {
  useAuthStore.setState({ accessToken: 'tok', refreshToken: 'ref', activeLearner: null })
  const { getByText } = render(<RootNavigator />)
  expect(getByText('Home (Plan 2)')).toBeTruthy()
})
