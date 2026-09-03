const mongoose = require('mongoose');

const requestTimelineSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceRequest', required: true, index: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: { 
    type: String, 
    enum: ['CREATED', 'STATUS_CHANGE', 'ASSIGNMENT_CHANGE', 'NOTE_ADDED'], 
    required: true 
  },
  details: {
    oldStatus: String,
    newStatus: String,
    assignedContractors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    noteText: String
  }
}, { timestamps: { createdAt: true, updatedAt: false } }); // Immutable timestamp

module.exports = mongoose.model('RequestTimeline', requestTimelineSchema);