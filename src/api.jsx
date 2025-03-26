import axios from 'axios';

const api = axios.create({
   baseURL: 'http://localhost:8000/api/',
   headers: {
     'Content-Type': 'application/json',
   },
});

// Request перехоплювач
api.interceptors.request.use(
   (config) => {
     const token = localStorage.getItem('token');
     console.log('Token being sent:', token);
     if (token) {
       config.headers.Authorization = `Token ${token}`; // Саме Token, як у бекенді
     } else {
       console.log('Token not found');
     }
     return config;
   },
   (error) => {
     return Promise.reject(error);
   }
);

export default api;