import http from './http.js';

export const authApi = {
  register: (account, password) => http.post('/auth/register', { account, password }),
  login: (account, password) => http.post('/auth/login', { account, password }),
  me: () => http.get('/auth/me'),
};

export const festivalApi = {
  list: (params) => http.get('/festivals', { params }),
  detail: (id, params) => http.get(`/festivals/${id}`, { params }),
  jump: (goodsId, platform) => http.post('/search-jump', { goodsId, platform }),
};

export const orderApi = {
  plans: () => http.get('/membership/plans'),
  create: (planCode) => http.post('/orders', { planCode }),
  pay: (orderId) => http.post(`/orders/${orderId}/pay`),
};

export const userApi = {
  profile: () => http.get('/user/profile'),
  orders: () => http.get('/user/orders'),
  changePassword: (oldPassword, newPassword) =>
    http.post('/user/password', { oldPassword, newPassword }),
};
