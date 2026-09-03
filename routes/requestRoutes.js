  const express = require('express');
  const MaintenanceRequest = require('../models/MaintenanceRequest');
  const RequestTimeline = require('../models/RequestTimeline');
  const { authenticateUser, requireRole } = require('../middleware/auth');

  const router = express.Router();

  router.use(authenticateUser);

  // Search & Filter Requests (Server-side)
  router.get('/', async (req, res) => {
    try {
      const { search, unitId, status, priority, contractorId, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;

      let query = {};

      // Role Enforcement: Contractors can ONLY view requests assigned to them
      if (req.user.role === 'CONTRACTOR') {
        query.assignedContractors = req.user.id;
      } else if (contractorId) {
        query.assignedContractors = contractorId;
      }

      if (search) query.$text = { $search: search };
      if (unitId) query.unitId = unitId;
      if (status) query.status = status;
      if (priority) query.priority = priority;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'asc' ? 1 : -1;

      const requests = await MaintenanceRequest.find(query)
        .populate('unitId', 'unitNumber address')
        .populate('assignedContractors', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await MaintenanceRequest.countDocuments(query);

      res.json({
        data: requests,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create Maintenance Request
  router.post('/', async (req, res) => {
    try {
      const { unitId, description, priority } = req.body;
      const request = await MaintenanceRequest.create({
        unitId,
        description,
        priority,
        createdBy: req.user.id
      });

      // Create initial timeline entry
      await RequestTimeline.create({
        requestId: request._id,
        actorId: req.user.id,
        actionType: 'CREATED',
        details: { noteText: 'Request reported.' }
      });

      res.status(201).json(request);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update Lifecycle Status (State Machine Enforcement)
  router.patch('/:id/status', async (req, res) => {
    try {
      const { newStatus } = req.body;
      const request = await MaintenanceRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ error: 'Request not found.' });

      const currentStatus = request.status;

      // Rule 1: Valid State Transitions Guard
      const validTransitions = {
        'Reported': ['Triaged'],
        'Triaged': ['Scheduled'],
        'Scheduled': ['Resolved'],
        'Resolved': ['Triaged'] // Reopen rule
      };

      if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(newStatus)) {
        return res.status(400).json({
          error: `Invalid transition from '${currentStatus}' to '${newStatus}'. Allowed paths: ${validTransitions[currentStatus]?.join(', ') || 'None'}`
        });
      }

      // Rule 2: Cannot move to Scheduled unless a contractor is assigned
      if (newStatus === 'Scheduled' && request.assignedContractors.length === 0) {
        return res.status(400).json({
          error: 'Cannot move status to Scheduled without at least one assigned contractor.'
        });
      }

      request.status = newStatus;
      await request.save();

      // Log immutable timeline event
      await RequestTimeline.create({
        requestId: request._id,
        actorId: req.user.id,
        actionType: 'STATUS_CHANGE',
        details: { oldStatus: currentStatus, newStatus }
      });

      res.json(request);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Assign Contractors (Property Manager Only)
  router.patch('/:id/assign', requireRole(['PROPERTY_MANAGER']), async (req, res) => {
    try {
      const { contractorIds } = req.body; // Array of user IDs
      const request = await MaintenanceRequest.findById(req.params.id);
      if (!request) return res.status(404).json({ error: 'Request not found.' });

      request.assignedContractors = contractorIds;
      await request.save();

      await RequestTimeline.create({
        requestId: request._id,
        actorId: req.user.id,
        actionType: 'ASSIGNMENT_CHANGE',
        details: { assignedContractors: contractorIds }
      });

      res.json(request);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Get Request Timeline History
  router.get('/:id/timeline', async (req, res) => {
    try {
      const timeline = await RequestTimeline.find({ requestId: req.params.id })
        .populate('actorId', 'name role')
        .populate('details.assignedContractors', 'name')
        .sort({ createdAt: 1 });
      res.json(timeline);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  module.exports = router;