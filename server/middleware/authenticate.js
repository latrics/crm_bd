import { verifyAuthToken } from '../utils/authToken.js';

export default function authenticate(req, res, next) {
  // Try cookie first, then fallback to Authorization header
  let token = req.cookies.access_token;
  
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = verifyAuthToken(token);
    req.user = decoded; // Contains { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token expired or invalid' });
  }
}
