import api from './axiosInstance.js';

export const getDocs = (params) => api.get('/docs', { params });
export const uploadDoc = (data) => api.post('/docs', data);
export const deleteDoc = (id) => api.delete(`/docs/${id}`);
