const express = require('express');
const router = express.Router();
const { getCollection, update } = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  const notifs = getCollection('notifications')
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifs);
});

router.put('/:id/read', authMiddleware, (req, res) => {
  const updated = update('notifications', req.params.id, { isRead: true });
  res.json(updated);
});

router.put('/read-all', authMiddleware, (req, res) => {
  const notifs = getCollection('notifications');
  const { saveCollection } = require('../services/db');
  const updated = notifs.map(n => n.userId === req.user.id ? { ...n, isRead: true } : n);
  saveCollection('notifications', updated);
  res.json({ message: 'تم' });
});

module.exports = router;
