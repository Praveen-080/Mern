// server/routes/checkout.js
const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Invoice = require("../models/Invoice");
const InventoryTransaction = require("../models/InventoryTransaction");

function generateInvoiceNo() {
  return `INV-${Date.now()}`;
}

/**
 * POST /api/cart/checkout
 * body: { customer, items: [{ productId, qty }] }
 *
 * Atomic stock decrement with rollback on failure.
 * Emits socket events: inventory:update, invoice:created, low-stock.
 */
router.post("/checkout", async (req, res) => {
  const io = req.app.get("io");
  try {
    const { customer = {}, items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Fetch product data
    const productIds = items.map((it) => it.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const byId = {};
    products.forEach((p) => (byId[String(p._id)] = p));

    // Prepare invoice snapshot and validate qtys
    const snapshotItems = [];
    let subtotal = 0;
    for (const it of items) {
      const p = byId[it.productId];
      if (!p)
        return res
          .status(400)
          .json({ error: `Product not found: ${it.productId}` });
      if (it.qty <= 0)
        return res
          .status(400)
          .json({ error: `Invalid quantity for ${p.name}` });

      const lineTotal = +(p.price * it.qty);
      subtotal += lineTotal;

      snapshotItems.push({
        productId: p._id,
        sku: p.sku || "",
        name: p.name,
        qty: it.qty,
        unitPrice: p.price,
        lineTotal,
      });
    }

    // Decrement stock atomically
    const updatedProducts = [];
    for (const it of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: it.productId, qty: { $gte: it.qty } },
        { $inc: { qty: -it.qty } },
        { new: true }
      );

      if (!updated) {
        // Rollback previous decrements
        for (const u of updatedProducts) {
          await Product.findByIdAndUpdate(u.productId, {
            $inc: { qty: u.qtyChanged },
          });
        }
        return res
          .status(400)
          .json({ error: `Not enough stock for product ${it.productId}` });
      }

      updatedProducts.push({ productId: updated._id, qtyChanged: it.qty });

      // Record inventory transaction
      try {
        await InventoryTransaction.create({
          productId: updated._id,
          change: -it.qty,
          reason: "sale",
        });
      } catch (e) {
        console.warn("Failed to write InventoryTransaction", e);
      }

      // Emit real-time stock update
      if (io) {
        io.emit("inventory:update", {
          productId: updated._id,
          qty: updated.qty,
        });

        // Emit low-stock alert if below reorder level
        const reorderLevel = updated.reorderLevel || 0;
        if (updated.qty <= reorderLevel) {
          io.emit("low-stock", {
            productId: updated._id,
            sku: updated.sku || "",
            name: updated.name,
            qty: updated.qty,
            reorderLevel,
          });
        }
      }
    }

    // Totals and invoice
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const invoiceNo = generateInvoiceNo();

    const invoice = await Invoice.create({
      invoiceNo,
      customer,
      items: snapshotItems,
      subtotal,
      tax,
      total,
    });

    // Emit invoice created
    if (io)
      io.emit("invoice:created", {
        invoiceId: invoice._id,
        invoiceNo,
        total,
      });

    return res.json({ invoiceId: invoice._id, invoiceNo });
  } catch (err) {
    console.error("Checkout error (non-transactional):", err);
    return res
      .status(500)
      .json({ error: "Checkout failed", details: err.message });
  }
});

module.exports = router;
