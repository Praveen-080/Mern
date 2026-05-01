const mongoose = require('mongoose');
const InventoryTransactionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  change: Number,
  reason: String,
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);
