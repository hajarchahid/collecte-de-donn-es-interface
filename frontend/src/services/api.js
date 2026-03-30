import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://www.speechai.fsac.ac.ma';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Force redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
