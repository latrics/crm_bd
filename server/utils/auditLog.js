import AuditLog from '../models/AuditLog.js';

export async function log({ userId, action, entity = null, entityId = null, ip = null, meta = null }) {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      ip_address: ip,
      meta,
    });
  } catch (err) {
    console.error('Audit log creation failed:', err.message);
  }
}
