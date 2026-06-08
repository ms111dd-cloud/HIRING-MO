const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data');

const collections = {
  users: 'users.json',
  candidates: 'candidates.json',
  interviews: 'interviews.json',
  offers: 'offers.json',
  templates: 'templates.json',
  notifications: 'notifications.json',
  branches: 'branches.json',
};

function getCollection(name) {
  const file = path.join(DB_PATH, collections[name]);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveCollection(name, data) {
  const file = path.join(DB_PATH, collections[name]);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function findById(collection, id) {
  return getCollection(collection).find(item => item.id === id);
}

function insert(collection, item) {
  const data = getCollection(collection);
  data.push(item);
  saveCollection(collection, data);
  return item;
}

function update(collection, id, updates) {
  const data = getCollection(collection);
  const idx = data.findIndex(item => item.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
  saveCollection(collection, data);
  return data[idx];
}

function remove(collection, id) {
  const data = getCollection(collection).filter(item => item.id !== id);
  saveCollection(collection, data);
}

function query(collection, filters = {}) {
  let data = getCollection(collection);
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      data = data.filter(item => item[key] === val);
    }
  });
  return data;
}

module.exports = { getCollection, saveCollection, findById, insert, update, remove, query };
