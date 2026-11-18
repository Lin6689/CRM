const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const { authMiddleware } = require("../middleware/auth");

const uploadDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

const router = express.Router();
router.use(authMiddleware);

const imageUrl = (req) =>
  req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || "";

router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { productName, sku, price, stockQuantity } = req.body;
    if (!productName || price === undefined || stockQuantity === undefined) {
      return res.status(400).json({ message: "productName, price and stockQuantity are required" });
    }
    const stock = Number(stockQuantity);
    if (stock < 0) return res.status(400).json({ message: "Stock cannot be negative" });

    const product = await Product.create({
      productName,
      sku: sku || "",
      price: Number(price),
      stockQuantity: stock,
      imageUrl: imageUrl(req),
      owner: req.user.id,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.image;
    delete updates.owner;
    if (updates.stockQuantity !== undefined && Number(updates.stockQuantity) < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }
    if (req.file) updates.imageUrl = imageUrl(req);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
