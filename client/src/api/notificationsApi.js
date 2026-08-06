import api from './axiosInstance.js';

export const getNotifications = async (role, userName) => {
  return await api.get('/notifications', {
    params: { role, userName }
  });
};

export const markNotificationAsRead = async (id, userName) => {
  return await api.patch(`/notifications/${id}/read`, { userName });
};

export const markNotificationAsUnread = async (id, userName) => {
  return await api.patch(`/notifications/${id}/unread`, { userName });
};

export const markAllNotificationsAsRead = async (role, userName) => {
  return await api.post('/notifications/read-all', { role, userName });
};

export const deleteNotificationApi = async (id) => {
  return await api.delete(`/notifications/${id}`);
};
