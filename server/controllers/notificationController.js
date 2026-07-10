import Notification from '../models/Notification.js';

export const createNotification = async (message, type, ownerName, leadId) => {
  try {
    await Notification.create({
      message,
      type,
      recipientRole: ['Super Admin', 'Admin'],
      recipientUser: ownerName || null,
      relatedId: leadId
    });
  } catch (error) {
    console.error('Failed to create notification', error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const { role, userName } = req.query; // Send from client to filter relevant notifications

    let queryRoles = ['All'];
    if (role) {
      if (role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super admin') {
        queryRoles.push('Super Admin', 'superadmin');
      }
      if (role.toLowerCase() === 'admin') {
        queryRoles.push('Admin', 'admin');
      }
    }

    let queryUser = userName;
    if (userName) {
      const cleanNameParts = userName.toLowerCase().split(/[^a-z0-9]+/);
      if (cleanNameParts.length > 0) {
        const regexStr = cleanNameParts.filter(Boolean).join('.*?');
        queryUser = { $regex: new RegExp(regexStr, 'i') };
      }
    }

    const query = {
      $or: [
        { recipientRole: { $in: queryRoles } },
        { recipientUser: queryUser }
      ]
    };
    
    // As per requirement, limit to 5, latest first
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;
    
    let update = {};
    if (userName) {
      update = { $addToSet: { readBy: userName } };
    } else {
      update = { $set: { isRead: true } }; // fallback for older records if needed, but primarily use readBy
    }

    const notification = await Notification.findByIdAndUpdate(id, update, { new: true });
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};
