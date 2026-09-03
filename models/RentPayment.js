const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema({
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true, index: true },
  monthYear: { type: String, required: true, index: true }, // Format: "YYYY-MM"
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('RentPayment', rentPaymentSchema);