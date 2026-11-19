const express = require("express");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Product = require("../models/Product");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Create invoice: auto-calculate totals + deduct stock
router.post("/", async (req, res) => {
  try {
    const { customerId, taxRate = 0, status = "Pending", items } = req.body;

    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "customerId and items are required" });
    }

    const customer = await Customer.findOne({ _id: customerId, owner: req.user.id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    // Har item ka price DB se lo (user ke diye price pe trust nahi)
    const invoiceItems = [];
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, owner: req.user.id });
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${product.productName}` });
      }
      invoiceItems.push({
        productId: product._id,
        productName: product.productName,
        quantity: Number(item.quantity),
        unitPrice: product.price,
      });
    }

    // Calculations
    const subtotal = invoiceItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const taxAmount = (subtotal * Number(taxRate)) / 100;
    const grandTotal = subtotal + taxAmount;

    // Stock deduct (sirf tab jab enough ho — upar check ho chuka)
    for (const item of invoiceItems) {
      await Product.updateOne(
        { _id: item.productId, owner: req.user.id },
        { $inc: { stockQuantity: -item.quantity } }
      );
    }

    const invoice = await Invoice.create({
      customerId: customer._id,
      customerName: customer.name,
      items: invoiceItems,
      subtotal,
      taxRate: Number(taxRate),
      taxAmount,
      grandTotal,
      status,
      owner: req.user.id,
    });

    // Pending invoice ka amount customer balance mein add karo
    if (status === "Pending") {
      await Customer.updateOne({ _id: customer._id }, { $inc: { currentBalance: grandTotal } });
    }

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Status update (Paid / Pending)
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Paid", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Status must be Paid or Pending" });
    }
    const old = await Invoice.findOne({ _id: req.params.id, owner: req.user.id });
    if (!old) return res.status(404).json({ message: "Invoice not found" });
    if (old.status === status) return res.json(old);

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status }, { new: true });

    // Balance adjust sirf tab jab status actually change ho
    const customer = await Customer.findOne({ _id: invoice.customerId });
    if (customer) {
      const diff = status === "Pending" ? invoice.grandTotal : -invoice.grandTotal;
      await Customer.updateOne({ _id: customer._id }, { $inc: { currentBalance: diff } });
    }
    res.json(invoice);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
