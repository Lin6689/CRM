const express = require("express");
const Customer = require("../models/Customer");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address, currentBalance } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }
    const duplicate = await Customer.findOne({ phone, owner: req.user.id });
    if (duplicate) {
      return res.status(400).json({ message: "Phone number already exists" });
    }
    const customer = await Customer.create({
      name,
      phone,
      email: email || "",
      address: address || "",
      currentBalance: Number(currentBalance) || 0,
      owner: req.user.id,
    });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.owner;

    if (updates.phone) {
      const duplicate = await Customer.findOne({
        phone: updates.phone,
        owner: req.user.id,
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
