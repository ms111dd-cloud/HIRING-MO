const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getCollection, insert, update, remove, findById } = require('../services/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/templates')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});
const upload = multer({ storage });

router.get('/', authMiddleware, (req, res) => res.json(getCollection('templates')));

router.post('/', authMiddleware, requireRole('admin', 'hr_manager'), upload.single('file'), (req, res) => {
  const { nameAr, type } = req.body;
  const t = insert('templates', {
    id: uuidv4(), nameAr, type,
    filePath: req.file.filename,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  res.json(t);
});

router.delete('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  remove('templates', req.params.id);
  res.json({ message: 'تم الحذف' });
});

module.exports = router;
