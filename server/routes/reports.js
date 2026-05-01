// server/routes/reports.js
const express = require("express");
const router = express.Router();

const Invoice = require("../models/Invoice");
const Product = require("../models/Product");

/**
 * GET /api/reports/sales
 * Query params:
 *   from (ISO date) optional
 *   to   (ISO date) optional
 *   groupBy = 'day'|'month' (defaults to 'day')
 *
 * Returns:
 * {
 *   totalSales,
 *   totalProfit,
 *   totalOrders,
 *   series: [ { period, total, orders } ],
 *   topProducts: [ { productId, name, sku, revenue, qtySold } ]
 * }
 */
router.get("/sales", async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const groupBy = (req.query.groupBy || "day").toLowerCase();

    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = from;
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        match.createdAt.$lte = toDate;
      }
    }

    // Totals
    const aggTotals = await Invoice.aggregate([
      { $match: Object.keys(match).length ? match : {} },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);
    const totalSales = aggTotals[0]?.totalSales || 0;
    const totalOrders = aggTotals[0]?.totalOrders || 0;

    // Compute totalProfit
    const invoices = await Invoice.find(Object.keys(match).length ? match : {})
      .select("items")
      .lean();
    const productIds = new Set();
    invoices.forEach((inv) =>
      inv.items.forEach((it) => productIds.add(String(it.productId)))
    );
    const products = await Product.find({
      _id: { $in: Array.from(productIds) },
    })
      .select("_id cost name")
      .lean();
    const costById = {};
    products.forEach((p) => (costById[String(p._id)] = p.cost || 0));

    let totalProfit = 0;
    invoices.forEach((inv) => {
      inv.items.forEach((it) => {
        const sale = it.lineTotal || it.unitPrice * it.qty || 0;
        const cost = (costById[String(it.productId)] || 0) * (it.qty || 0);
        totalProfit += sale - cost;
      });
    });

    // Series (day / month)
    const dateFormat =
      groupBy === "month"
        ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
        : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

    const seriesAgg = await Invoice.aggregate([
      { $match: Object.keys(match).length ? match : {} },
      {
        $group: {
          _id: dateFormat,
          total: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const series = seriesAgg.map((s) => ({
      period: s._id,
      total: +s.total.toFixed(2),
      orders: s.orders,
    }));

    // Top products
    const topProductsAgg = await Invoice.aggregate([
      { $match: Object.keys(match).length ? match : {} },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          revenue: { $sum: "$items.lineTotal" },
          qtySold: { $sum: "$items.qty" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    const topProductIds = topProductsAgg.map((p) => p._id);
    const topProdDocs = await Product.find({ _id: { $in: topProductIds } })
      .select("name sku")
      .lean();
    const topById = {};
    topProdDocs.forEach((p) => (topById[String(p._id)] = p));

    const topProducts = topProductsAgg.map((p) => ({
      productId: p._id,
      name:
        (topById[String(p._id)] && topById[String(p._id)].name) || "Unknown",
      sku: (topById[String(p._id)] && topById[String(p._id)].sku) || "",
      revenue: +p.revenue.toFixed(2),
      qtySold: p.qtySold,
    }));

    return res.json({
      totalSales: +totalSales.toFixed(2),
      totalProfit: +totalProfit.toFixed(2),
      totalOrders,
      series,
      topProducts,
    });
  } catch (err) {
    console.error("Reports error", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
