import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Додаємо токен до кожного запиту
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обробка помилок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Якщо токен протух або не валідний
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      // Якщо немає прав доступу
      alert('У вас недостатньо прав для цієї дії');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email, password) => api.post('users/login/', { email, password }),
  register: (userData) => api.post('users/', userData),
  getMe: () => api.get('users/me/'),
};

// Campaigns API
export const campaignsApi = {
  getAll: (params) => api.get('campaigns/', { params }),
  getForModeration: () => api.get('campaigns/moderation_list/'),
  getById: (id) => api.get(`campaigns/${id}/`),
  create: (campaignData) => api.post('campaigns/', campaignData),
  update: (id, campaignData) => api.patch(`campaigns/${id}/`, campaignData),
  approve: (id) => api.post(`campaigns/${id}/approve/`),
  reject: (id) => api.post(`campaigns/${id}/reject/`),
};

// Users API (для адмінів/модераторів)
export const usersApi = {
  getAll: () => api.get('users/'),
  makeAdmin: (userId) => api.post(`users/${userId}/make_admin/`),
  makeModerator: (userId) => api.post(`users/${userId}/make_moderator/`),
};

// Donations API
export const donationsApi = {
  create: (donationData) => api.post('donations/', donationData),
  getUserDonations: () => api.get('donations/'),
};

// Допоміжні функції для роботи з ролями
export const checkRole = {
  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role === 'admin';
  },
  isModerator: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return ['moderator', 'admin'].includes(user?.role);
  },
};

export default api;