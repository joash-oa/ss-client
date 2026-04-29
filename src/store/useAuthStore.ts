import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

type ActiveLearner = { id: string; name: string; avatarEmoji: string }

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  activeLearner: ActiveLearner | null
  setTokens: (access: string, refresh: string) => Promise<void>
  clearAuth: () => Promise<void>
  setActiveLearner: (learner: ActiveLearner) => void
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  activeLearner: null,

  setTokens: async (access, refresh) => {
    await SecureStore.setItemAsync('access_token', access)
    await SecureStore.setItemAsync('refresh_token', refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('refresh_token')
    set({ accessToken: null, refreshToken: null, activeLearner: null })
  },

  setActiveLearner: (learner) => set({ activeLearner: learner }),

  hydrate: async () => {
    const access = await SecureStore.getItemAsync('access_token')
    const refresh = await SecureStore.getItemAsync('refresh_token')
    if (access && refresh) {
      set({ accessToken: access, refreshToken: refresh })
    }
  },
}))
