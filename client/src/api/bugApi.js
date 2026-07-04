import api from './axiosInstance.js';

export const reportBug = async (bugData) => {
  try {
    return await api.post('/bugs/report', bugData);
  } catch (err) {
    throw err.response?.data || err;
  }
};
