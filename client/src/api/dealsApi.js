import api from './axiosInstance.js';

const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const getDeals = async () => {
  try {
    return await api.get('/deals');
  } catch (err) {
    return { success: true, data: getLocal('deals') };
  }
};

export const createDeal = async (data) => {
  try {
    return await api.post('/deals', data);
  } catch (err) {
    const deals = getLocal('deals');
    const newDeal = { ...data, _id: 'local_d_' + Date.now(), createdAt: new Date().toISOString() };
    deals.unshift(newDeal);
    setLocal('deals', deals);
    return { success: true, data: newDeal };
  }
};

export const updateDeal = async (id, data) => {
  try {
    return await api.put(`/deals/${id}`, data);
  } catch (err) {
    let deals = getLocal('deals');
    deals = deals.map(d => d._id === id ? { ...d, ...data } : d);
    setLocal('deals', deals);
    return { success: true, data: { ...data, _id: id } };
  }
};

export const deleteDeal = async (id) => {
  try {
    return await api.delete(`/deals/${id}`);
  } catch (err) {
    let deals = getLocal('deals');
    deals = deals.filter(d => d._id !== id);
    setLocal('deals', deals);
    return { success: true };
  }
};

export const revertDeal = async (id) => {
  try {
    return await api.post(`/deals/${id}/revert`);
  } catch (err) {
    let deals = getLocal('deals');
    const deal = deals.find(d => d._id === id);
    if (deal) {
      deals = deals.filter(d => d._id !== id);
      setLocal('deals', deals);
      // Revert to lead?
      const leads = getLocal('leads');
      const lead = { ...deal, _id: deal.from_lead_id || 'local_l_' + Date.now(), status: 'Communicated' };
      leads.unshift(lead);
      setLocal('leads', leads);
      return { success: true };
    }
    throw err;
  }
};
