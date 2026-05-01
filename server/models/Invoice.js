const mongoose = require('mongoose');
const InvoiceItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: String,
  name: String,
  qty: Number,
  unitPrice: Number,
  lineTotal: Number,
});
const InvoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, unique: true },
  customer: { name: String, phone: String, address: String },
  items: [InvoiceItemSchema],
  subtotal: Number,
  tax: Number,
  discount: { type: Number, default: 0 },
  total: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
}, { timestamps: true });
module.exports = mongoose.model('Invoice', InvoiceSchema);
