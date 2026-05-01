const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
  sku: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  category: { type: String, default: 'General' },
  price: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  qty: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 5 },
  metadata: Object
}, { timestamps: true });
module.exports = mongoose.model('Product', ProductSchema);
