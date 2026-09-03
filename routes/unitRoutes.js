const express = require('express');
const Unit = require('../models/Unit');
const { authenticateUser, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

// Get portfolio units (Managers see all, filtering out archived by default)
router.get('/', async (req, res) => {
  try {
    const showArchived = req.query.archived === 'true';
    const filter = showArchived ? {} : { isArchived: false };
    const units = await Unit.find(filter).sort({ unitNumber: 1 });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Unit (Manager only)
router.post('/', requireRole(['PROPERTY_MANAGER']), async (req, res) => {
  try {
    const unit = await Unit.create(req.body);
    res.status(201).json(unit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Archive / Restore Unit (Manager only)
router.patch('/:id/archive', requireRole(['PROPERTY_MANAGER']), async (req, res) => {
  try {
    const { isArchived } = req.body;
    const unit = await Unit.findByIdAndUpdate(
      req.params.id,
      { isArchived: Boolean(isArchived) },
      { new: true }
    );
    res.json(unit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;