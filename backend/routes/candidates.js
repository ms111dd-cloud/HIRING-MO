const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { getCollection, insert, update, remove, query, findById } = require('../services/db');
const { extractCVData } = require('../services/openai.service');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { addNotification } = require('../services/notifications');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/cvs')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Extract text from PDF or DOCX
async function extractText(filePath, mimetype) {
  if (mimetype === 'application/pdf' || filePath.endsWith('.pdf')) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } else {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
}

// POST /api/candidates/upload
router.post('/upload', authMiddleware, requireRole('hr_manager', 'admin'), upload.array('cvs', 20), async (req, res) => {
  const results = [];
  for (const file of req.files) {
    try {
      const text = await extractText(file.path, file.mimetype);
      const aiData = await extractCVData(text);
      const candidate = {
        id: uuidv4(),
        ...aiData,
        cvFilePath: file.filename,
        cvOriginalName: file.originalname,
        status: 'new',
        uploadedBy: req.user.id,
        createdAt: new Date().toISOString(),
      };
      insert('candidates', candidate);
      results.push({ success: true, name: aiData.fullName || file.originalname, id: candidate.id });
    } catch (err) {
      results.push({ success: false, name: file.originalname, error: err.message });
    }
  }
  res.json({ results });
});

// GET /api/candidates
router.get('/', authMiddleware, (req, res) => {
  let candidates = getCollection('candidates');
  const { status, nationality, branch } = req.query;
  if (status) candidates = candidates.filter(c => c.status === status);
  if (nationality) candidates = candidates.filter(c => c.nationality?.includes(nationality));
  res.json(candidates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// GET /api/candidates/:id
router.get('/:id', authMiddleware, (req, res) => {
  const candidate = findById('candidates', req.params.id);
  if (!candidate) return res.status(404).json({ error: 'المرشح غير موجود' });
  res.json(candidate);
});

// PUT /api/candidates/:id/evaluate — academic supervisor
router.put('/:id/evaluate', authMiddleware, requireRole('academic_supervisor', 'admin'), (req, res) => {
  const { decision, notes } = req.body;
  const candidate = findById('candidates', req.params.id);
  if (!candidate) return res.status(404).json({ error: 'المرشح غير موجود' });

  const statusMap = { suitable: 'shortlisted', unsuitable: 'rejected', needs_review: 'under_review' };
  const updated = update('candidates', req.params.id, {
    status: statusMap[decision] || 'under_review',
    evaluationDecision: decision,
    evaluationNotes: notes,
    evaluatedBy: req.user.id,
    evaluatedAt: new Date().toISOString(),
  });

  if (decision === 'suitable') {
    const hrUsers = getCollection('users').filter(u => u.role === 'hr_manager');
    hrUsers.forEach(hr => {
      addNotification(hr.id, 'interview_request', `طلب مقابلة: ${candidate.fullName}`, { candidateId: candidate.id });
    });
  }

  res.json(updated);
});

// DELETE /api/candidates/:id
router.delete('/:id', authMiddleware, requireRole('hr_manager', 'admin'), (req, res) => {
  remove('candidates', req.params.id);
  res.json({ message: 'تم الحذف' });
});

module.exports = router;
