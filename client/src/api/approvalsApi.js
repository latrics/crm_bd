import api from './axiosInstance.js';

export const getApprovals = async () => {
  return await api.get('/admin/approvals');
};

export const updateApproval = async (id, status) => {
  return await api.put(`/admin/approvals/${id}`, { status });
};

export const resetApprovals = async () => {
  return await api.post('/admin/approvals/reset');
};
