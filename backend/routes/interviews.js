const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getCollection, insert, update, findById } = require('../services/db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { generateInterviewEmail, generateRejectionEmail, generateInterviewQuestions } = require('../services/openai.service');
const { addNotification } = require('../services/notifications');

router.get('/', authMiddleware, (req, res) => {
  let interviews = getCollection('interviews');
  const candidates = getCollection('candidates');
  const users = getCollection('users');
  const branches = getCollection('branches');
  if (req.user.role === 'interviewer') {
    interviews = interviews.filter(i => i.interviewerId === req.user.id);
  }
  const enriched = interviews.map(i => ({
    ...i,
    candidate: candidates.find(c => c.id === i.candidateId),
    interviewer: users.find(u => u.id === i.interviewerId),
    branch: branches.find(b => b.id === i.branchId),
  }));
  res.json(enriched.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)));
});

router.post('/', authMiddleware, requireRole('hr_manager', 'admin'), (req, res) => {
  const { candidateId, interviewerId, branchId, jobTitle, scheduledAt } = req.body;
  const candidate = findById('candidates', candidateId);
  if (!candidate) return res.status(404).json({ error: 'المرشح غير موجود' });
  const interview = insert('interviews', {
    id: uuidv4(), candidateId, interviewerId, branchId, jobTitle, scheduledAt,
    status: 'scheduled', result: null, notes: null, rating: null,
    createdBy: req.user.id, createdAt: new Date().toISOString(),
  });
  update('candidates', candidateId, { status: 'interview_scheduled' });
  addNotification(interviewerId, 'interview_assigned', `تم تعيينك مقابلاً للمرشح: ${candidate.fullName}`, { interviewId: interview.id });
  res.json(interview);
});

router.put('/:id/result', authMiddleware, requireRole('interviewer', 'hr_manager', 'admin'), (req, res) => {
  const { result, notes, rating } = req.body;
  const interview = findById('interviews', req.params.id);
  if (!interview) return res.status(404).json({ error: 'المقابلة غير موجودة' });
  const updated = update('interviews', req.params.id, { result, notes, rating, status: 'done', resultSubmittedAt: new Date().toISOString() });
  if (result === 'accepted') {
    update('candidates', interview.candidateId, { status: 'accepted' });
    const candidate = findById('candidates', interview.candidateId);
    getCollection('users').filter(u => u.role === 'hr_manager').forEach(hr => {
      addNotification(hr.id, 'candidate_accepted', `تم قبول المرشح: ${candidate?.fullName} — جاهز للعرض الوظيفي`, { candidateId: interview.candidateId });
    });
  } else if (result === 'rejected') {
    update('candidates', interview.candidateId, { status: 'rejected' });
  }
  res.json(updated);
});

router.post('/draft-email', authMiddleware, requireRole('hr_manager', 'admin'), async (req, res) => {
  const { candidateId, timeSlots, interviewerName, jobTitle, branch } = req.body;
  const candidate = findById('candidates', candidateId);
  if (!candidate) return res.status(404).json({ error: 'المرشح غير موجود' });
  const slotsText = timeSlots && timeSlots.length > 0
    ? timeSlots.map((s, i) => `الخيار ${i + 1}: ${s}`).join('\n')
    : 'سيتم تحديد الموعد لاحقاً';
  const email = await generateInterviewEmail(candidate, slotsText, interviewerName, jobTitle, branch);
  res.json(email);
});

router.post('/questions', authMiddleware, async (req, res) => {
  const { candidateId } = req.body;
  const candidate = findById('candidates', candidateId);
  if (!candidate) return res.status(404).json({ error: 'المرشح غير موجود' });
  const questions = await generateInterviewQuestions(candidate);
  res.json(questions);
});

module.exports = router;