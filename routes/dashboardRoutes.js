const express = require('express');
const router = express.Router();
const Request = require('../models/MaintenanceRequest');
const Unit = require('../models/Unit');
const RentPayment = require('../models/RentPayment');
const { authenticateUser } = require('../middleware/auth');

router.get('/', authenticateUser, async (req, res) => {
  try {
    const openRequests = await Request.countDocuments({ status: { $ne: 'Resolved' } });

    // Calculate requests resolved this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const resolvedThisWeek = await Request.countDocuments({
      status: 'Resolved',
      updatedAt: { $gte: oneWeekAgo },
    });

    // Request Breakdown counts
    const reported = await Request.countDocuments({ status: 'Reported' });
    const triaged = await Request.countDocuments({ status: 'Triaged' });
    const scheduled = await Request.countDocuments({ status: 'Scheduled' });
    const resolved = await Request.countDocuments({ status: 'Resolved' });

    // Build 8-Week Trend Array
    const resolved8WeekTrend = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);

      const end = new Date();
      end.setDate(end.getDate() - i * 7);

      const count = await Request.countDocuments({
        status: 'Resolved',
        updatedAt: { $gte: start, $lt: end },
      });

      resolved8WeekTrend.push({
        week: `Wk ${8 - i}`,
        resolvedCount: count,
      });
    }

    // Rent metrics
    const currentMonth = new Date().toISOString().slice(0, 7);
    const payments = await RentPayment.find({ monthYear: currentMonth });
    const rentCollectedCurrentMonth = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    const units = await Unit.find({ isArchived: false });
    let rentOverdueUnits = 0;
    units.forEach((unit) => {
      const unitPaid = payments
        .filter((p) => p.unitId.toString() === unit._id.toString())
        .reduce((sum, p) => sum + p.amountPaid, 0);
      if (unitPaid < unit.monthlyRent) {
        rentOverdueUnits++;
      }
    });

    res.json({
      openRequests,
      rentOverdueUnits,
      resolvedThisWeek,
      rentCollectedCurrentMonth,
      requestsBreakdown: {
        reported,
        triaged,
        scheduled,
        resolved,
      },
      resolved8WeekTrend,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;