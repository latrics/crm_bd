import axios from 'axios';

const API_URL = '/api/v1/auth';

// Configure axios to send cookies with every request
axios.defaults.withCredentials = true;

export const login = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_URL}/logout`);
  } catch (err) {
    console.error('Logout error:', err);
  }
};

export const refresh = async () => {
  try {
    const res = await axios.post(`${API_URL}/refresh`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getMe = async () => {
  try {
    const res = await axios.get(`${API_URL}/me`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const verifyInvite = async (token) => {
  try {
    const res = await axios.get(`${API_URL}/verify-invite?token=${token}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const acceptInvite = async (token, name, password) => {
  try {
    const res = await axios.post(`${API_URL}/accept-invite`, { token, name, password });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const updatePassword = async (currentPassword, newPassword) => {
  try {
    const res = await axios.put(`${API_URL}/update-password`, { currentPassword, newPassword });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
