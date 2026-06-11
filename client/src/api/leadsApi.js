import api from './axiosInstance.js';

// Mock DB for fallback when server is down
const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const getLeads = async () => {
  try {
    return await api.get('/leads');
  } catch (err) {
    console.warn('Backend down, loading from localStorage');
    return { success: true, data: getLocal('leads') };
  }
};

export const createLead = async (data) => {
  try {
    return await api.post('/leads', data);
  } catch (err) {
    console.warn('Backend down, saving to localStorage');
    const leads = getLocal('leads');
    const newLead = { ...data, _id: 'local_' + Date.now(), createdAt: new Date().toISOString() };
    leads.unshift(newLead);
    setLocal('leads', leads);
    return { success: true, data: newLead, message: 'Saved to local storage (Offline Mode)' };
  }
};

export const updateLead = async (id, data) => {
  try {
    return await api.put(`/leads/${id}`, data);
  } catch (err) {
    console.warn('Backend down, updating in localStorage');
    let leads = getLocal('leads');
    leads = leads.map(l => l._id === id ? { ...l, ...data } : l);
    setLocal('leads', leads);
    return { success: true, data: { ...data, _id: id } };
  }
};

export const deleteLead = async (id) => {
  try {
    return await api.delete(`/leads/${id}`);
  } catch (err) {
    console.warn('Backend down, deleting from localStorage');
    let leads = getLocal('leads');
    leads = leads.filter(l => l._id !== id);
    setLocal('leads', leads);
    return { success: true };
  }
};

export const convertLead = async (id) => {
  try {
    return await api.post(`/leads/${id}/convert`);
  } catch (err) {
    // Basic mock conversion
    let leads = getLocal('leads');
    const lead = leads.find(l => l._id === id);
    if (lead) {
      lead.status = 'Converted';
      setLocal('leads', leads);
      // Also add to deals
      const deals = getLocal('deals');
      const newDeal = { ...lead, _id: 'deal_' + Date.now(), stage: 'Negotiation', title: lead.name };
      deals.unshift(newDeal);
      setLocal('deals', deals);
      return { success: true, data: { lead, deal: newDeal } };
    }
    throw err;
  }
};
