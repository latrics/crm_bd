import Notification from '../models/Notification.js';

export const createNotification = async ({ message, type, recipientUser = null, recipientRoles = [], relatedId = null, category = null }) => {
  try {
    let finalCategory = category;
    if (!finalCategory) {
      const msgLower = message.toLowerCase();
      if (msgLower.includes('lead')) {
        finalCategory = 'Leads';
      } else if (msgLower.includes('deal')) {
        finalCategory = 'Deals';
      } else if (msgLower.includes('tender')) {
        finalCategory = 'Tenders';
      } else {
        finalCategory = 'System';
      }
    }

    await Notification.create({
      message,
      type,
      recipientRole: recipientRoles,
      recipientUser: recipientUser,
      relatedId: relatedId,
      category: finalCategory
    });
  } catch (error) {
    console.error('Failed to create notification', error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const { role, userName, limit } = req.query; // Send from client to filter relevant notifications


    let queryRoles = ['All', 'all'];
    if (role) {
      const lowerRole = role.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerRole === 'superadmin') {
        queryRoles.push('Super Admin', 'superadmin');
      } else if (lowerRole === 'admin') {
        queryRoles.push('Admin', 'admin');
      } else if (lowerRole === 'manager') {
        queryRoles.push('Manager', 'manager');
      } else if (lowerRole === 'member') {
        queryRoles.push('Member', 'member');
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
    
    let queryBuilder = Notification.find(query).sort({ createdAt: -1 });
    if (limit && limit !== 'all') {
      queryBuilder = queryBuilder.limit(parseInt(limit, 10));
    }

    const notifications = await queryBuilder;

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
      update = { $set: { isRead: true } };
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

export const markAsUnread = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;
    
    let update = {};
    if (userName) {
      update = { $pull: { readBy: userName } };
    } else {
      update = { $set: { isRead: false } };
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

export const markAllAsRead = async (req, res, next) => {
  try {
    const { userName, role } = req.body;
    if (!userName) {
      return res.status(400).json({ success: false, message: 'userName is required' });
    }

    let queryRoles = ['All', 'all'];
    if (role) {
      const lowerRole = role.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerRole === 'superadmin') {
        queryRoles.push('Super Admin', 'superadmin');
      } else if (lowerRole === 'admin') {
        queryRoles.push('Admin', 'admin');
      } else if (lowerRole === 'manager') {
        queryRoles.push('Manager', 'manager');
      } else if (lowerRole === 'member') {
        queryRoles.push('Member', 'member');
      }
    }

    let queryUser = userName;
    const cleanNameParts = userName.toLowerCase().split(/[^a-z0-9]+/);
    if (cleanNameParts.length > 0) {
      const regexStr = cleanNameParts.filter(Boolean).join('.*?');
      queryUser = { $regex: new RegExp(regexStr, 'i') };
    }

    const query = {
      $or: [
        { recipientRole: { $in: queryRoles } },
        { recipientUser: queryUser }
      ]
    };

    await Notification.updateMany(query, { $addToSet: { readBy: userName } });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
