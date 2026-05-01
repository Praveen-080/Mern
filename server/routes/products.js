const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  const products = await Product.find().sort('name');
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

router.post('/', async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    if (req.app && req.app.get('io')) req.app.get('io').emit('product:created', p);
    res.json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    if (req.app && req.app.get('io')) req.app.get('io').emit('product:updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await Product.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Not found' });
    if (req.app && req.app.get('io')) req.app.get('io').emit('product:deleted', { _id: removed._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
