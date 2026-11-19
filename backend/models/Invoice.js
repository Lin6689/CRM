const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerName: { type: String, required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0 }, // percentage
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: ["Paid", "Pending"], default: "Pending" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
