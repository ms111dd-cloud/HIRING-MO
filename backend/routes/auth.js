const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getCollection, insert, findById } = require('../services/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = getCollection('users');
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }
  if (!user.isActive) return res.status(403).json({ error: 'الحساب غير نشط' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  const { password: _, ...userSafe } = user;
  res.json({ token, user: userSafe });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const { password: _, ...userSafe } = req.user;
  res.json(userSafe);
});

// POST /api/auth/seed — creates default admin (run once)
router.post('/seed', (req, res) => {
  const users = getCollection('users');
  if (users.length > 0) return res.json({ message: 'تم الإنشاء مسبقاً' });

  const branches = [
    { id: uuidv4(), code: 'RUH', nameAr: 'الرياض', nameEn: 'Riyadh' },
    { id: uuidv4(), code: 'JED', nameAr: 'جدة', nameEn: 'Jeddah' },
    { id: uuidv4(), code: 'AHB', nameAr: 'الأحساء', nameEn: 'Al-Ahsa' },
    { id: uuidv4(), code: 'DMS', nameAr: 'الدمام', nameEn: 'Dammam' },
  ];
  const { saveCollection } = require('../services/db');
  saveCollection('branches', branches);

  const defaultUsers = [
    { id: uuidv4(), name: 'مساعد محمد', email: 'hr@hiringmo.com', password: bcrypt.hashSync('admin123', 10), role: 'hr_manager', isActive: true, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'المشرفة الأكاديمية', email: 'supervisor@hiringmo.com', password: bcrypt.hashSync('super123', 10), role: 'academic_supervisor', isActive: true, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'المقابل', email: 'interviewer@hiringmo.com', password: bcrypt.hashSync('inter123', 10), role: 'interviewer', isActive: true, createdAt: new Date().toISOString() },
  ];
  saveCollection('users', defaultUsers);
  res.json({ message: 'تم إنشاء المستخدمين الافتراضيين', users: defaultUsers.map(u => ({ email: u.email, password: u.role === 'hr_manager' ? 'admin123' : u.role === 'academic_supervisor' ? 'super123' : 'inter123', role: u.role })) });
});

// GET /api/auth/users — admin only
router.get('/users', authMiddleware, (req, res) => {
  const users = getCollection('users').map(({ password: _, ...u }) => u);
  res.json(users);
});

module.exports = router;
