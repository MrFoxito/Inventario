import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'huawei-inventory-secret-key-2026';

export function generateToken(user) {
  return jwt.sign(
    { name: user.name, role: user.role, email: user.email }, 
    SECRET_KEY, 
    { expiresIn: '7d' }
  );
}

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Admin access required' });
  }
}
