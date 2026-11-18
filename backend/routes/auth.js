const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, businessName } = req.body;
    if (!name || !email || !password || !businessName) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, businessName });
    res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, businessName: user.businessName } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, businessName: user.businessName } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
