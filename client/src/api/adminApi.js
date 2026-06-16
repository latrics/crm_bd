import axios from 'axios';

const API_URL = '/api/v1/admin';

// Configure axios to send cookies with every request
axios.defaults.withCredentials = true;

const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
});

export const inviteUser = async (email, role) => {
  try {
    const res = await axios.post(`${API_URL}/invite`, { email, role }, getHeaders());
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getUsers = async () => {
  try {
    const res = await axios.get(`${API_URL}/users`, getHeaders());
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const deleteUser = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/users/${id}`, getHeaders());
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
