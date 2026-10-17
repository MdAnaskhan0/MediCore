import axios from 'axios';
import store, { logout } from './store';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(cfg => {
  const t = store.getState().auth.token;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401 && store.getState().auth.token) store.dispatch(logout());
  return Promise.reject(err);
});
export const errMsg = e => e.response?.data?.message || 'Something went wrong. Check that the server is running.';
export const money = v => '৳' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default api;
