const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  description: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'], 
    default: 'Medium',
    index: true 
  },
  status: { 
    type: String, 
    enum: ['Reported', 'Triaged', 'Scheduled', 'Resolved'], 
    default: 'Reported',
    index: true 
  },
  assignedContractors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

maintenanceRequestSchema.index({ description: 'text' });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);