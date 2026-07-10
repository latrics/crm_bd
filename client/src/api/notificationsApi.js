import api from './axiosInstance.js';

export const getNotifications = async (role, userName) => {
  return await api.get('/notifications', {
    params: { role, userName }
  });
};

export const markNotificationAsRead = async (id, userName) => {
  return await api.patch(`/notifications/${id}/read`, { userName });
};
