import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Додаємо таймаут 10 секунд
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

// Покращена обробка помилок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?session_expired=true';
    }
    if (error.response?.status === 403) {
      if (error.response.data?.detail) {
        return Promise.reject(new Error(error.response.data.detail));
      }
      return Promise.reject(new Error('У вас недостатньо прав для цієї дії'));
    }
    if (error.response?.status === 429) {
      return Promise.reject(new Error('Забагато запитів. Спробуйте пізніше'));
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email, password) => api.post('users/login/', { email, password }),
  register: (userData) => api.post('users/', userData),
  getMe: () => api.get('users/me/'),
  refreshToken: () => api.post('users/token/refresh/'),
};

// Campaigns API
export const campaignsApi = {
  getAll: (params) => api.get('fundraisers/', { params }),
  getForModeration: () => api.get('fundraisers/moderation/campaigns/'),
  getById: (id) => api.get(`fundraisers/${id}/`),
  create: (campaignData) => api.post('fundraisers/', campaignData),
  update: (id, campaignData) => api.patch(`fundraisers/${id}/`, campaignData),
  approve: (id, resolutionNote = '') => 
    api.patch(`fundraisers/${id}/moderate/`, { status: 'approved', resolution_note: resolutionNote }),
  reject: (id, resolutionNote = '') => 
    api.patch(`fundraisers/${id}/moderate/`, { status: 'rejected', resolution_note: resolutionNote }),
  pause: (id, resolutionNote = '') => 
    api.patch(`fundraisers/${id}/moderate/`, { status: 'paused', resolution_note: resolutionNote }),
  getReports: (id) => api.get(`fundraisers/${id}/reports/`),
  checkReports: (id) => api.get(`fundraisers/${id}/check_reports/`),
};

// Reports API
export const reportsApi = {
  create: (reportData) => api.post('reports/', reportData),
  getAll: (params) => api.get('reports/', { params }),
  getById: (id) => api.get(`reports/${id}/`),
  updateStatus: (id, status, resolutionNote = '') =>
    api.patch(`reports/${id}/`, { status, resolution_note: resolutionNote }),
  getForModeration: () => api.get('reports/for_moderation/'),
  check: (fundraiserId) => api.get('reports/check/', { params: { fundraiser: fundraiserId } }),
  getCampaignReports: (campaignId) => api.get(`reports/?fundraiser=${campaignId}`),
  getRecentApproved: () => api.get('reports/recent_approved/'),
  checkReportsThreshold: (id) => api.get(`reports/check_threshold/?fundraiser=${id}`),
};

// Users API
export const usersApi = {
  getAll: (params) => api.get('users/', { params }),
  getById: (id) => api.get(`users/${id}/`),
  update: (id, userData) => api.patch(`users/${id}/`, userData),
  makeAdmin: (userId) => api.post(`users/${userId}/make_admin/`),
  makeModerator: (userId) => api.post(`users/${userId}/make_moderator/`),
  getActivity: (userId) => api.get(`users/${userId}/activity/`),
};

// Donations API
export const donationsApi = {
  create: (donationData) => api.post('donations/', donationData),
  getUserDonations: () => api.get('donations/my/'),
  getCampaignDonations: (campaignId) => api.get(`donations/?campaign=${campaignId}`),
  verify: (donationId) => api.post(`donations/${donationId}/verify/`),
};

// Допоміжні функції
export const utilsApi = {
  getStats: () => api.get('utils/stats/'),
  getModerationStats: () => api.get('utils/moderation_stats/'),
};

// Робота з ролями
export const checkRole = {
  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role === 'admin';
  },
  isModerator: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return ['moderator', 'admin'].includes(user?.role);
  },
  isOwner: (campaignCreatorId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id === campaignCreatorId;
  },
};

export default api;