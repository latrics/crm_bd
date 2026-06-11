import api from './axiosInstance.js';

const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const getTenders = async () => {
  try {
    return await api.get('/tenders');
  } catch (err) {
    return { success: true, data: getLocal('tenders') };
  }
};

export const createTender = async (data) => {
  try {
    return await api.post('/tenders', data);
  } catch (err) {
    const tenders = getLocal('tenders');
    const newTender = { ...data, _id: 'local_t_' + Date.now(), createdAt: new Date().toISOString() };
    tenders.unshift(newTender);
    setLocal('tenders', tenders);
    return { success: true, data: newTender };
  }
};

export const updateTender = async (id, data) => {
  try {
    return await api.put(`/tenders/${id}`, data);
  } catch (err) {
    let tenders = getLocal('tenders');
    tenders = tenders.map(t => t._id === id ? { ...t, ...data } : t);
    setLocal('tenders', tenders);
    return { success: true, data: { ...data, _id: id } };
  }
};

export const deleteTender = async (id) => {
  try {
    return await api.delete(`/tenders/${id}`);
  } catch (err) {
    let tenders = getLocal('tenders');
    tenders = tenders.filter(t => t._id !== id);
    setLocal('tenders', tenders);
    return { success: true };
  }
};
