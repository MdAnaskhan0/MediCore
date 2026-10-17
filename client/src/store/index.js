import { configureStore, createSlice } from '@reduxjs/toolkit';

const saved = () => { try { return JSON.parse(localStorage.getItem('hms_auth')) || {}; } catch { return {}; } };

const auth = createSlice({
  name: 'auth',
  initialState: { token: saved().token || null, user: saved().user || null },
  reducers: {
    loginSuccess(s, { payload }) { s.token = payload.token; s.user = payload.user; localStorage.setItem('hms_auth', JSON.stringify(payload)); },
    logout(s) { s.token = null; s.user = null; localStorage.removeItem('hms_auth'); },
  },
});
const ui = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: false },
  reducers: { toggleSidebar(s) { s.sidebarOpen = !s.sidebarOpen; }, closeSidebar(s) { s.sidebarOpen = false; } },
});

export const { loginSuccess, logout } = auth.actions;
export const { toggleSidebar, closeSidebar } = ui.actions;
export default configureStore({ reducer: { auth: auth.reducer, ui: ui.reducer } });
