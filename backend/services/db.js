const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "createdAt" TEXT
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      code TEXT,
      "nameAr" TEXT,
      "nameEn" TEXT,
      city TEXT
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      data JSONB
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      data JSONB
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      data JSONB
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      data JSONB
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      data JSONB
    )
  `);
}

async function getCollection(name) {
  if (name === 'users') {
    const res = await query('SELECT * FROM users');
    return res.rows;
  }
  if (name === 'branches') {
    const res = await query('SELECT * FROM branches');
    return res.rows;
  }
  const res = await query(`SELECT data FROM ${name}`);
  return res.rows.map(r => r.data);
}

async function saveCollection(name, data) {
  await query(`DELETE FROM ${name}`);
  for (const item of data) {
    if (name === 'users') {
      await query(
        `INSERT INTO users (id, name, email, password, role, "isActive", "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [item.id, item.name, item.email, item.password, item.role, item.isActive, item.createdAt]
      );
    } else if (name === 'branches') {
      await query(
        `INSERT INTO branches (id, code, "nameAr", "nameEn", city) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [item.id, item.code, item.nameAr, item.nameEn, item.city]
      );
    } else {
      await query(`INSERT INTO ${name} (id, data) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING`, [item.id, JSON.stringify(item)]);
    }
  }
}

async function findById(collection, id) {
  if (collection === 'users') {
    const res = await query('SELECT * FROM users WHERE id=$1', [id]);
    return res.rows[0] || null;
  }
  if (collection === 'branches') {
    const res = await query('SELECT * FROM branches WHERE id=$1', [id]);
    return res.rows[0] || null;
  }
  const res = await query(`SELECT data FROM ${collection} WHERE id=$1`, [id]);
  return res.rows[0]?.data || null;
}

async function insert(collection, item) {
  if (collection === 'users') {
    await query(
      `INSERT INTO users (id, name, email, password, role, "isActive", "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [item.id, item.name, item.email, item.password, item.role, item.isActive, item.createdAt]
    );
  } else if (collection === 'branches') {
    await query(
      `INSERT INTO branches (id, code, "nameAr", "nameEn", city) VALUES ($1,$2,$3,$4,$5)`,
      [item.id, item.code, item.nameAr, item.nameEn, item.city]
    );
  } else {
    await query(`INSERT INTO ${collection} (id, data) VALUES ($1,$2)`, [item.id, JSON.stringify(item)]);
  }
  return item;
}

async function update(collection, id, updates) {
  const current = await findById(collection, id);
  if (!current) return null;
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  if (collection === 'users') {
    await query(
      `UPDATE users SET name=$1, email=$2, password=$3, role=$4, "isActive"=$5 WHERE id=$6`,
      [updated.name, updated.email, updated.password, updated.role, updated.isActive, id]
    );
  } else if (collection === 'branches') {
    await query(
      `UPDATE branches SET code=$1, "nameAr"=$2, "nameEn"=$3, city=$4 WHERE id=$5`,
      [updated.code, updated.nameAr, updated.nameEn, updated.city, id]
    );
  } else {
    await query(`UPDATE ${collection} SET data=$1 WHERE id=$2`, [JSON.stringify(updated), id]);
  }
  return updated;
}

async function remove(collection, id) {
  await query(`DELETE FROM ${collection} WHERE id=$1`, [id]);
}

module.exports = { query, initDB, getCollection, saveCollection, findById, insert, update, remove };