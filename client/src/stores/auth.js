import { defineStore } from 'pinia';
import { authApi } from '../api/index.js';
import { getToken, setToken, clearToken } from '../api/http.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getToken(),
    user: null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    isMember: (state) => Boolean(state.user?.isMember),
  },
  actions: {
    setAuth(token, user) {
      setToken(token);
      this.token = token;
      this.user = user;
    },
    async register(account, password) {
      const { data } = await authApi.register(account, password);
      this.setAuth(data.token, data.user);
    },
    async login(account, password) {
      const { data } = await authApi.login(account, password);
      this.setAuth(data.token, data.user);
    },
    async fetchProfile() {
      if (!this.token) return;
      try {
        const { data } = await authApi.me();
        this.user = data;
      } catch {
        this.logout();
      }
    },
    logout() {
      clearToken();
      this.token = null;
      this.user = null;
    },
  },
});
