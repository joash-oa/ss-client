import { apiRequest } from './client'

type AuthResponse = { access_token: string; refresh_token: string }

export const authApi = {
  register: (body: { email: string; password: string; pin: string }) =>
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body, auth: false }),

  login: (body: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body, auth: false }),

  refresh: (body: { refresh_token: string }) =>
    apiRequest<AuthResponse>('/auth/refresh', { method: 'POST', body, auth: false }),
}
