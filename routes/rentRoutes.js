const express = require('express');
const { Parser } = require('json2csv');
const Unit = require('../models/Unit');
const RentPayment = require('../models/RentPayment');
const { authenticateUser, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateUser);

// Bulk Record Rent Payments (Property Manager Only)
router.post('/bulk', requireRole(['PROPERTY_MANAGER']), async (req, res) => {
  try {
    const { monthYear, payments } = req.body; // payments: [{ unitIdentifier (unitNumber), amount }]
    const report = [];

    for (const payment of payments) {
      const unit = await Unit.findOne({ unitNumber: payment.unitIdentifier });

      if (!unit) {
        report.push({ unitIdentifier: payment.unitIdentifier, status: 'unmatched', message: 'Unit identifier not found' });
        continue;
      }

      await RentPayment.create({
        unitId: unit._id,
        monthYear,
        amountPaid: payment.amount,
        recordedBy: req.user.id
      });

      if (payment.amount === unit.monthlyRent) {
        report.push({ unitNumber: unit.unitNumber, status: 'matched', amountPaid: payment.amount });
      } else if (payment.amount < unit.monthlyRent) {
        report.push({ unitNumber: unit.unitNumber, status: 'underpaid', amountPaid: payment.amount, expected: unit.monthlyRent });
      } else {
        report.push({ unitNumber: unit.unitNumber, status: 'overpaid', amountPaid: payment.amount, expected: unit.monthlyRent });
      }
    }

    res.json({ monthYear, summaryReport: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Current Rent Roll as CSV
router.get('/export-csv', requireRole(['PROPERTY_MANAGER']), async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const units = await Unit.find({ isArchived: false });

    const rentRollData = await Promise.all(units.map(async (unit) => {
      const payments = await RentPayment.find({ unitId: unit._id, monthYear: currentMonth });
      const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

      let status = 'UNPAID';
      if (totalPaid === unit.monthlyRent) status = 'MATCHED';
      else if (totalPaid > unit.monthlyRent) status = 'OVERPAID';
      else if (totalPaid > 0) status = 'UNDERPAID';

      return {
        UnitNumber: unit.unitNumber,
        Address: unit.address,
        TenantName: unit.tenantName,
        MonthlyRent: unit.monthlyRent,
        TotalPaidCurrentMonth: totalPaid,
        PaymentStatus: status
      };
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(rentRollData);

    res.header('Content-Type', 'text/csv');
    res.attachment(`Rent_Roll_${currentMonth}.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;