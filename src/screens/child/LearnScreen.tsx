import { View, Text } from 'react-native'
import { colors } from '../../constants/theme'

export function LearnScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.textPrimary }}>Learn (Plan 3)</Text>
    </View>
  )
}
