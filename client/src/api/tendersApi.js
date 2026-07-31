import api from './axiosInstance.js';

const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const getTenders = async () => {
  try {
    return await api.get('/tenders');
  } catch (err) {
    if (err.response) throw err;
    return { success: true, data: getLocal('tenders') };
  }
};

export const createTender = async (data) => {
  try {
    return await api.post('/tenders', data);
  } catch (err) {
    if (err.response) throw err;
    const tenders = getLocal('tenders');
    const newTender = { ...data, _id: 'local_t_' + Date.now(), createdAt: new Date().toISOString() };
    tenders.unshift(newTender);
    setLocal('tenders', tenders);
    return { success: true, data: newTender };
  }
};

export const importTenders = async (tendersArray) => {
  try {
    return await api.post('/tenders/import', { tenders: tendersArray });
  } catch (err) {
    if (err.response) throw err;
    const existing = getLocal('tenders');
    const imported = tendersArray.map((t, idx) => ({ ...t, _id: 'local_t_imp_' + Date.now() + '_' + idx, createdAt: new Date().toISOString() }));
    const updated = [...imported, ...existing];
    setLocal('tenders', updated);
    return { success: true, count: imported.length, data: imported };
  }
};

export const updateTender = async (id, data) => {
  try {
    return await api.put(`/tenders/${id}`, data);
  } catch (err) {
    if (err.response) throw err;
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
    if (err.response) throw err;
    let tenders = getLocal('tenders');
    tenders = tenders.filter(t => t._id !== id);
    setLocal('tenders', tenders);
    return { success: true };
  }
};

export const deleteMultipleTenders = async (ids) => {
  try {
    return await api.post('/tenders/bulk-delete', { ids });
  } catch (err) {
    if (err.response) throw err;
    let tenders = getLocal('tenders');
    tenders = tenders.filter(t => !ids.includes(t._id));
    setLocal('tenders', tenders);
    return { success: true };
  }
};

export const updateMultipleTenders = async (ids, updateData) => {
  try {
    return await api.post('/tenders/bulk-update', { ids, updateData });
  } catch (err) {
    if (err.response) throw err;
    let tenders = getLocal('tenders');
    tenders = tenders.map(t => ids.includes(t._id) ? { ...t, ...updateData } : t);
    setLocal('tenders', tenders);
    return { success: true, data: tenders.filter(t => ids.includes(t._id)) };
  }
};

export const resetTenderCounter = async () => {
  return await api.post('/tenders/reset-counter');
};
