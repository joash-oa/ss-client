import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { HomeScreen } from '../screens/child/HomeScreen'
import { LearnScreen } from '../screens/child/LearnScreen'
import { RanksScreen } from '../screens/child/RanksScreen'
import { ProfileScreen } from '../screens/child/ProfileScreen'
import { colors } from '../constants/theme'

export type ChildTabParams = {
  Home: undefined
  Learn: undefined
  Ranks: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<ChildTabParams>()

export function ChildNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Ranks" component={RanksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
