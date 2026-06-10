const jwt = require('jsonwebtoken');
const { getCollection } = require('../services/db');

const JWT_SECRET = process.env.JWT_SECRET || 'hiring-mo-secret-2024';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'غير مصرح' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = getCollection('users');
    const user = users.find(u => u.id === decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ error: 'المستخدم غير نشط' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, JWT_SECRET };