import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'

export function RanksScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.textPrimary }}>Ranks (Plan 4)</Text>
    </View>
  )
}
