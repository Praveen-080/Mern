const express = require("express");
const router = express.Router();
const Invoice = require("../models/Invoice");
const Product = require("../models/Product");

/**
 * GET /api/sales/history
 * Query params:
 *   q (search by customer/invoiceNo)
 *   from, to (date range)
 */
router.get("/history", async (req, res) => {
  try {
    const { q, from, to } = req.query;
    const match = {};

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        match.createdAt.$lte = toDate;
      }
    }

    if (q) {
      match.$or = [
        { invoiceNo: { $regex: q, $options: "i" } },
        { "customer.name": { $regex: q, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(match)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Add itemCount field
    invoices.forEach((inv) => (inv.itemCount = inv.items?.length || 0));

    res.json(invoices);
  } catch (err) {
    console.error("Sales history error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
