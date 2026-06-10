const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getCollection, insert, saveCollection } = require('../services/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  const { password: _, ...userSafe } = req.user;
  res.json(userSafe);
});

router.post('/seed', (req, res) => {
  try {
    const users = getCollection('users');
    if (users.length > 0) return res.json({ message: 'تم الإنشاء مسبقاً' });

    const branches = [
      { id: uuidv4(), code: 'RUH', nameAr: 'الرياض', nameEn: 'Riyadh', city: 'Riyadh' },
      { id: uuidv4(), code: 'JED', nameAr: 'جدة', nameEn: 'Jeddah', city: 'Jeddah' },
      { id: uuidv4(), code: 'AHB', nameAr: 'الأحساء', nameEn: 'Al-Ahsa', city: 'Al-Ahsa' },
      { id: uuidv4(), code: 'DMS', nameAr: 'الدمام', nameEn: 'Dammam', city: 'Dammam' },
    ];
    saveCollection('branches', branches);

    const defaultUsers = [
      { id: uuidv4(), name: 'مساعد محمد', email: 'hr@hiringmo.com', password: bcrypt.hashSync('admin123', 10), role: 'hr_manager', isActive: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'المشرفة الأكاديمية', email: 'supervisor@hiringmo.com', password: bcrypt.hashSync('super123', 10), role: 'academic_supervisor', isActive: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'المقابل', email: 'interviewer@hiringmo.com', password: bcrypt.hashSync('inter123', 10), role: 'interviewer', isActive: true, createdAt: new Date().toISOString() },
    ];
    saveCollection('users', defaultUsers);

    res.json({ message: 'تم إنشاء المستخدمين', users: defaultUsers.map(u => ({ email: u.email, role: u.role })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', authMiddleware, (req, res) => {
  try {
    const users = getCollection('users');
    res.json(users.map(({ password: _, ...u }) => u));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;