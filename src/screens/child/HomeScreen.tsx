import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'

export function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.textPrimary }}>Home (Plan 2)</Text>
    </View>
  )
}
