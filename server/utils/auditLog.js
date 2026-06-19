import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export async function log({ userId, action, entity = null, entityId = null, ip = null, meta = null, severity = 'info' }) {
  try {
    let user_name = 'System';
    let user_role = 'System';

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user_name = user.name;
        user_role = user.role;
      }
    }

    await AuditLog.create({
      user_id: userId,
      user_name,
      user_role,
      action,
      entity,
      entity_id: entityId,
      ip_address: ip,
      meta,
      severity,
    });
  } catch (err) {
    console.error('Audit log creation failed:', err.message);
  }
}
