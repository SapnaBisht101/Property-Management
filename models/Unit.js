const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  unitNumber: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  monthlyRent: { type: Number, required: true },
  tenantName: { type: String, required: true },
  isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Unit', unitSchema);