const mongoose = require('mongoose');

const dismissedAlertSchema = new mongoose.Schema({
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  monthYear: { type: String, required: true }, // Format: "YYYY-MM"
  dismissedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

dismissedAlertSchema.index({ unitId: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('DismissedAlert', dismissedAlertSchema);