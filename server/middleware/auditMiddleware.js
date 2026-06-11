import AuditLog from '../models/AuditLog.js';

export const logActivity = (module, action) => {
  return async (req, res, next) => {
    // Only log successful operations or as needed
    // We'll wrap the res.send/res.json to log after completion
    const originalJson = res.json;
    
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Run log in background
        AuditLog.create({
          action: action || req.method,
          module,
          user: req.user ? req.user._id : null,
          details: {
            path: req.originalUrl,
            params: req.params,
            body: req.body, // Be careful with sensitive data here
            response: data
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }).catch(err => console.error('Audit Log Error:', err));
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};
