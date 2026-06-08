const { v4: uuidv4 } = require('uuid');
const { insert, getCollection, update } = require('./db');

function addNotification(userId, type, message, payload = {}) {
  return insert('notifications', {
    id: uuidv4(),
    userId,
    type,
    message,
    payload,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

module.exports = { addNotification };
