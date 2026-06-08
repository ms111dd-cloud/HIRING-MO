const express = require('express');
const router = express.Router();
const { getCollection } = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

router.get('/stats', authMiddleware, (req, res) => {
  const candidates = getCollection('candidates');
  const interviews = getCollection('interviews');
  const offers = getCollection('offers');

  res.json({
    totalCVs: candidates.length,
    newCVs: candidates.filter(c => c.status === 'new').length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    accepted: candidates.filter(c => ['accepted', 'offer_issued'].includes(c.status)).length,
    interviewsScheduled: interviews.filter(i => i.status === 'scheduled').length,
    interviewsDone: interviews.filter(i => i.status === 'done').length,
    offersIssued: offers.length,
    byNationality: candidates.reduce((acc, c) => {
      const nat = c.nationality || 'غير محدد';
      acc[nat] = (acc[nat] || 0) + 1;
      return acc;
    }, {}),
    byStatus: candidates.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {}),
  });
});

module.exports = router;
