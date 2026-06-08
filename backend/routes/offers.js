const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { getCollection, insert, update, findById } = require('../services/db');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/offers — list offers
router.get('/', authMiddleware, requireRole('hr_manager', 'admin'), (req, res) => {
  const offers = getCollection('offers');
  const candidates = getCollection('candidates');
  const branches = getCollection('branches');
  const enriched = offers.map(o => ({
    ...o,
    candidate: candidates.find(c => c.id === o.candidateId),
    branch: branches.find(b => b.id === o.branchId),
  }));
  res.json(enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// GET /api/offers/ready — candidates accepted, no offer yet
router.get('/ready', authMiddleware, requireRole('hr_manager', 'admin'), (req, res) => {
  const candidates = getCollection('candidates').filter(c => c.status === 'accepted');
  const offers = getCollection('offers');
  const withoutOffer = candidates.filter(c => !offers.find(o => o.candidateId === c.id));
  res.json(withoutOffer);
});

// POST /api/offers — create offer and generate DOCX
router.post('/', authMiddleware, requireRole('hr_manager', 'admin'), async (req, res) => {
  const {
    candidateId, branchId, jobTitle, basicSalary, housingAllowance,
    transportAllowance, totalSalary, startDate, probationPeriod,
    contractType, extraBenefits, templateId
  } = req.body;

  const candidate = findById('candidates', candidateId);
  if (!candidate) return res.status(404).json({ error: 'المرشح غير موجود' });

  const branch = findById('branches', branchId);
  const template = findById('templates', templateId);

  let generatedFile = null;

  if (template) {
    const templatePath = path.join(__dirname, '../uploads/templates', template.filePath);
    if (fs.existsSync(templatePath)) {
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      doc.render({
        CANDIDATE_NAME: candidate.fullName,
        NATIONALITY: candidate.nationality,
        JOB_TITLE: jobTitle,
        BRANCH: branch?.nameAr || '',
        BASIC_SALARY: basicSalary,
        HOUSING_ALLOWANCE: housingAllowance,
        TRANSPORT_ALLOWANCE: transportAllowance,
        TOTAL_SALARY: totalSalary,
        START_DATE: startDate,
        PROBATION_PERIOD: probationPeriod,
        CONTRACT_TYPE: contractType,
        EXTRA_BENEFITS: extraBenefits || '',
        DATE_TODAY: new Date().toLocaleDateString('ar-SA'),
      });

      const buf = doc.getZip().generate({ type: 'nodebuffer' });
      const fileName = `offer-${candidate.fullName.replace(/\s/g, '_')}-${Date.now()}.docx`;
      const outPath = path.join(__dirname, '../uploads/offers');
      if (!fs.existsSync(outPath)) fs.mkdirSync(outPath, { recursive: true });
      fs.writeFileSync(path.join(outPath, fileName), buf);
      generatedFile = fileName;
    }
  }

  const offer = insert('offers', {
    id: uuidv4(),
    candidateId, branchId, jobTitle, basicSalary, housingAllowance,
    transportAllowance, totalSalary, startDate, probationPeriod,
    contractType, extraBenefits, templateId,
    generatedFile,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  });

  update('candidates', candidateId, { status: 'offer_issued' });
  res.json({ ...offer, downloadUrl: generatedFile ? `/uploads/offers/${generatedFile}` : null });
});

// GET /api/offers/:id/download
router.get('/:id/download', authMiddleware, (req, res) => {
  const offer = findById('offers', req.params.id);
  if (!offer?.generatedFile) return res.status(404).json({ error: 'الملف غير موجود' });
  const filePath = path.join(__dirname, '../uploads/offers', offer.generatedFile);
  res.download(filePath);
});

module.exports = router;
