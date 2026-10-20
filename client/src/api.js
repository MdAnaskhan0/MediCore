import axios from 'axios';
import store, { logout, patientLogout } from './store';

const api = axios.create({ baseURL: '/api' });
const isPortal = url => url === '/portal' || (url || '').startsWith('/portal/');

api.interceptors.request.use(cfg => {
  const s = store.getState();
  const t = isPortal(cfg.url) ? s.patient.token : s.auth.token;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(r => r, err => {
  const s = store.getState();
  if (err.response?.status === 401) {
    if (isPortal(err.config?.url) && s.patient.token) store.dispatch(patientLogout());
    else if (!isPortal(err.config?.url) && !(err.config?.url || '').startsWith('/public') && s.auth.token) store.dispatch(logout());
  }
  return Promise.reject(err);
});
export const errMsg = e => e.response?.data?.message || 'Something went wrong. Check that the server is running.';
export const money = v => '৳' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default api;
