import { colors, fonts, radius } from '../../src/constants/theme'

test('colors has required keys', () => {
  expect(colors.bg).toBe('#0f0f1a')
  expect(colors.primary).toBe('#4361EE')
  expect(colors.accent).toBe('#4CC9F0')
  expect(colors.star).toBe('#FFD166')
})

test('radius.full is 999', () => {
  expect(radius.full).toBe(999)
})
