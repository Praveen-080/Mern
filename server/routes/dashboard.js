const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

router.get('/stats', async (req, res) => {
  try {
    const aggStock = await Product.aggregate([{ $group: { _id: null, totalStock: { $sum: '$qty' } } }]);
    const totalStock = (aggStock[0] && aggStock[0].totalStock) || 0;
    const aggSalesSimple = await Invoice.aggregate([{ $group: { _id: null, totalSales: { $sum: '$total' } } }]);
    const totalSales = (aggSalesSimple[0] && aggSalesSimple[0].totalSales) || 0;
    const invoices = await Invoice.find({}, 'items').lean();
    const productIds = new Set();
    invoices.forEach(inv => inv.items.forEach(it => productIds.add(String(it.productId))));
    const prodList = await Product.find({ _id: { $in: Array.from(productIds) } }, '_id cost').lean();
    const costById = {};
    prodList.forEach(p => costById[String(p._id)] = p.cost || 0);
    let totalProfit = 0;
    invoices.forEach(inv => {
      inv.items.forEach(it => {
        const sale = (it.lineTotal || (it.unitPrice * it.qty)) || 0;
        const unitCost = costById[String(it.productId)] || 0;
        const cost = unitCost * (it.qty || 0);
        totalProfit += (sale - cost);
      });
    });
    res.json({ totalStock, totalSales: +totalSales.toFixed(2), totalProfit: +totalProfit.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
