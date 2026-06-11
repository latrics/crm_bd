import axios from 'axios';

const API_URL = '/api/v1/auth';

// Configure axios to send cookies with every request
axios.defaults.withCredentials = true;

export const login = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    if (res.data.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_URL}/logout`);
    localStorage.removeItem('accessToken');
  } catch (err) {
    console.error('Logout error:', err);
  }
};

export const refresh = async () => {
  try {
    const res = await axios.post(`${API_URL}/refresh`);
    if (res.data.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getMe = async () => {
  try {
    const res = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
