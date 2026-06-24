import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true
});

// Response interceptor to handle data and errors cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Just reject the error and let the React components or API functions handle it.
    // Clerk handles its own token refresh natively.
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
