import jwt from 'jsonwebtoken';

/**
 * Signs a JWT access token containing { id, role }
 * @param {Object} payload 
 * @returns {string} Signed JWT token
 */
export function generateAuthToken(payload) {
  return jwt.sign(
    { id: payload.id, role: payload.role },
    process.env.JWT_ACCESS_SECRET || 'your_jwt_secret_here',
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '12h' } // We can make session duration 12h or match configuration
  );
}

/**
 * Verifies a JWT access token
 * @param {string} token 
 * @returns {Object} Decoded payload { id, role }
 */
export function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'your_jwt_secret_here');
}

/**
 * Attaches the auth token cookie to the response
 * @param {Object} res Express response object
 * @param {string} token Signed JWT
 */
export function setAuthCookie(res, token) {
  const maxAge = 12 * 60 * 60 * 1000; // 12 hours
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge,
    path: '/'
  });
}

/**
 * Clears the auth token cookie
 * @param {Object} res Express response object
 */
export function clearAuthCookie(res) {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/'
  });
}
