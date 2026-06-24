import AuditLog from '../models/AuditLog.js';
import Lead from '../models/Lead.js';
import Tender from '../models/Tender.js';
import User from '../models/User.js';
import Doc from '../models/Doc.js';
import Deal from '../models/Deal.js';

const getModel = (moduleName) => {
  switch (moduleName) {
    case 'Leads': return Lead;
    case 'Tenders': return Tender;
    case 'Users': return User;
    case 'Documents': return Doc;
    case 'Deals': return Deal;
    default: return null;
  }
};

const displayRole = (role) => {
  if (!role) return 'System';
  if (role.toLowerCase() === 'superadmin' || role.toLowerCase() === 'super_admin') return 'Super Admin';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const getSeverity = (module, action, changes) => {
  const normAction = action?.toLowerCase() || '';
  const normModule = module?.toLowerCase() || '';

  // Critical (Red)
  if (
    normAction.includes('delete') || 
    normAction.includes('remove') ||
    normModule.includes('role') || 
    normModule.includes('permission') || 
    normAction.includes('denied') ||
    normAction === 'user_role_changed' ||
    normAction === 'force_logout'
  ) {
    return 'critical';
  }

  // Warning (Orange)
  if (
    normAction.includes('reassign') || 
    normAction.includes('transfer') || 
    normAction.includes('ownership') ||
    normAction.includes('disable') || 
    normAction.includes('suspend') ||
    normModule.includes('config') || 
    normModule.includes('master') ||
    (changes && (changes.isActive?.new === false || 'owner' in changes || 'assignedTo' in changes))
  ) {
    return 'warning';
  }

  // Success (Green)
  if (
    normAction.includes('create') || 
    normAction.includes('approve') ||
    normAction === 'accept_invite'
  ) {
    return 'success';
  }

  // Info (Grey)
  return 'info';
};

export const logActivity = (module, action) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const Model = getModel(module);
    
    let beforeData = null;
    try {
      if (Model && req.params.id && ['PUT', 'PATCH', 'DELETE', 'POST'].includes(req.method)) {
        beforeData = await Model.findById(req.params.id).lean();
      }
    } catch (err) {
      console.warn('Failed to fetch beforeData:', err.message);
    }
    
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Sanitize sensitive data from body
        const sanitizeBody = (body) => {
          if (!body) return null;
          const clean = { ...body };
          delete clean.password;
          delete clean.token;
          return clean;
        };

        const responseId = data?._id || data?.data?._id || req.params?.id || null;

        const performLog = async () => {
          let afterData = null;
          try {
            if (Model && responseId && ['PUT', 'PATCH', 'POST'].includes(req.method)) {
              afterData = await Model.findById(responseId).lean();
            }
          } catch (err) {
            console.warn('Failed to fetch afterData:', err.message);
          }

          const changes = {};
          if (beforeData && afterData) {
            const skipFields = ['_id', '__v', 'createdAt', 'updatedAt', 'password'];
            const allKeys = new Set([
              ...Object.keys(beforeData),
              ...Object.keys(afterData)
            ]);

            for (const key of allKeys) {
              if (skipFields.includes(key)) continue;
              const valBefore = beforeData[key];
              const valAfter = afterData[key];
              if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
                changes[key] = {
                  old: valBefore !== undefined ? valBefore : null,
                  new: valAfter !== undefined ? valAfter : null
                };
              }
            }
          }

          // Build dynamic message
          const actorName = req.user ? req.user.name : 'System';
          const actorRole = req.user && req.user.role ? displayRole(req.user.role) : 'System';
          let displayMessage = '';

          const displayRoleStr = (r) => {
            if (!r) return 'user';
            if (r.toLowerCase() === 'superadmin' || r.toLowerCase() === 'super_admin') return 'Super Admin';
            return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
          };

          const formatLead = (doc) => {
            if (!doc) return '';
            const code = doc._id ? ` #LD-${doc._id.toString().slice(-4).toUpperCase()}` : '';
            return `${doc.name || ''}${code}`;
          };

          const formatTender = (doc) => {
            if (!doc) return '';
            return `#${doc.tender_no || ''}`;
          };

          const act = action || req.method;

          if (act === 'CREATE' || req.method === 'POST') {
            if (module === 'Users') {
              const createdUser = afterData || data?.data || data;
              displayMessage = `${actorRole} ${actorName} created ${displayRoleStr(createdUser?.role)} ${createdUser?.name || ''}`;
            } else if (module === 'Leads') {
              const createdLead = afterData || data?.data || data;
              displayMessage = `${actorRole} ${actorName} created Lead ${formatLead(createdLead)}`;
            } else if (module === 'Tenders') {
              const createdTender = afterData || data?.data || data;
              displayMessage = `${actorRole} ${actorName} created Tender ${formatTender(createdTender)}`;
            } else if (module === 'Documents') {
              const doc = afterData || data?.data || data;
              displayMessage = `${actorRole} ${actorName} uploaded document ${doc?.title || doc?.filename || ''}`;
            } else {
              displayMessage = `${actorRole} ${actorName} created a new ${module.toLowerCase()}`;
            }
          } else if (act === 'DELETE' || req.method === 'DELETE') {
            if (module === 'Users') {
              displayMessage = `${actorRole} ${actorName} removed user ${beforeData?.name || ''}`;
            } else if (module === 'Leads') {
              displayMessage = `${actorRole} ${actorName} deleted Lead ${formatLead(beforeData)}`;
            } else if (module === 'Tenders') {
              displayMessage = `${actorRole} ${actorName} deleted Tender ${formatTender(beforeData)}`;
            } else if (module === 'Documents') {
              displayMessage = `${actorRole} ${actorName} deleted document ${beforeData?.title || beforeData?.filename || ''}`;
            } else {
              displayMessage = `${actorRole} ${actorName} deleted a ${module.toLowerCase()}`;
            }
          } else if (act === 'CONVERT') {
            displayMessage = `${actorRole} ${actorName} converted Lead ${formatLead(beforeData || afterData)} to Deal`;
          } else if (act === 'UPDATE' || req.method === 'PUT' || req.method === 'PATCH') {
            if (module === 'Users') {
              if (changes.isActive) {
                const statusText = changes.isActive.new ? 'enabled' : 'disabled';
                displayMessage = `${actorRole} ${actorName} ${statusText} ${displayRoleStr(afterData?.role)} ${afterData?.name || ''}`;
              } else if (changes.password) {
                displayMessage = `${actorRole} ${actorName} reset password for ${displayRoleStr(afterData?.role)} ${afterData?.name || ''}`;
              } else if (changes.role) {
                displayMessage = `${actorRole} ${actorName} changed role of ${afterData?.name || ''} to ${displayRoleStr(afterData?.role)}`;
              } else {
                displayMessage = `${actorRole} ${actorName} updated details for ${displayRoleStr(afterData?.role)} ${afterData?.name || ''}`;
              }
            } else if (module === 'Leads') {
              if (changes.owner) {
                displayMessage = `${actorRole} ${actorName} reassigned Lead ${formatLead(afterData)} owner to ${afterData?.owner || ''}`;
              } else if (changes.status) {
                displayMessage = `${actorRole} ${actorName} changed lead status of ${formatLead(afterData)} from ${changes.status.old || 'Leads'} to ${changes.status.new || 'Leads'}`;
              } else {
                displayMessage = `${actorRole} ${actorName} updated Lead ${formatLead(afterData)}`;
              }
            } else if (module === 'Tenders') {
              if (changes.status) {
                displayMessage = `${actorRole} ${actorName} changed status of Tender ${formatTender(afterData)} from ${changes.status.old} to ${changes.status.new}`;
              } else {
                displayMessage = `${actorRole} ${actorName} updated Tender ${formatTender(afterData)}`;
              }
            } else {
              displayMessage = `${actorRole} ${actorName} updated ${module.toLowerCase()}`;
            }
          } else {
            displayMessage = `${actorRole} ${actorName} performed ${act.toLowerCase()} on ${module.toLowerCase()}`;
          }

          const severityLevel = getSeverity(module, act, changes);

          await AuditLog.create({
            action: act,
            entity: module,
            entity_id: responseId ? responseId.toString() : null,
            user_id: req.user ? req.user._id : null,
            user_name: req.user ? req.user.name : 'System',
            user_role: req.user ? req.user.role : 'System',
            severity: severityLevel,
            meta: {
              path: req.originalUrl,
              params: req.params,
              body: sanitizeBody(req.body),
              userAgent: req.headers['user-agent'],
              message: displayMessage,
              changes: Object.keys(changes).length > 0 ? changes : undefined,
              before: beforeData || undefined,
              after: afterData || undefined
            },
            ip_address: req.ip
          });
        };

        performLog()
          .then(() => originalJson.call(this, data))
          .catch(err => {
            console.error('Audit Log Error:', err);
            originalJson.call(this, data);
          });
      } else {
        originalJson.call(this, data);
      }
    };

    next();
  };
};
