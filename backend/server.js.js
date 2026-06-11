require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Static uploads ──────────────────────────────────────────
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/candidates',    require('./routes/candidates'));
app.use('/api/interviews',    require('./routes/interviews'));
app.use('/api/offers',        require('./routes/offers'));
app.use('/api/templates',     require('./routes/templates'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard',     require('./routes/dashboard'));

// ── Serve React frontend in production ──────────────────────
const frontendBuild = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'HIRING-MO API is running ✅', version: '1.0.0' });
  });
}

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ HIRING-MO server running on port ${PORT}`);
});
