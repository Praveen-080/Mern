const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');

router.get('/:id/pdf', async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).send('Invoice not found');
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-disposition', `attachment; filename=${invoice.invoiceNo}.pdf`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);
  doc.fontSize(20).text('Grocery Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice: ${invoice.invoiceNo}`);
  doc.text(`Date: ${invoice.createdAt.toLocaleString()}`);
  doc.moveDown();
  if (invoice.customer && invoice.customer.name) {
    doc.text(`Customer: ${invoice.customer.name}`);
    doc.text(`Phone: ${invoice.customer.phone || '-'}`);
    if (invoice.customer.address) doc.text(`Address: ${invoice.customer.address}`);
    doc.moveDown();
  }
  doc.font('Helvetica-Bold');
  doc.text('Item', 50, doc.y, { continued: true });
  doc.text('Qty', 320, doc.y, { continued: true });
  doc.text('Unit', 380, doc.y, { continued: true });
  doc.text('Line', 460, doc.y);
  doc.font('Helvetica');
  doc.moveDown();
  invoice.items.forEach(it => {
    doc.text(it.name, 50, doc.y, { continued: true });
    doc.text(String(it.qty), 320, doc.y, { continued: true });
    doc.text(it.unitPrice.toFixed(2), 380, doc.y, { continued: true });
    doc.text(it.lineTotal.toFixed(2), 460, doc.y);
    doc.moveDown(0.2);
  });
  doc.moveDown();
  doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, { align: 'right' });
  doc.text(`Tax: ${invoice.tax.toFixed(2)}`, { align: 'right' });
  if (invoice.discount && invoice.discount > 0) doc.text(`Discount: ${invoice.discount.toFixed(2)}`, { align: 'right' });
  doc.text(`Total: ${invoice.total.toFixed(2)}`, { align: 'right' });
  doc.end();
});

module.exports = router;
