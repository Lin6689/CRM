require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const customerRoutes = require("./routes/customers");
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

const MD_DBR =
  process.env.MONGODB_URI ||
  "mongodb+srv://dhavalll852004_db_user:HAy6x0lelQWI4WvP@cluster0.1okxzjw.mongodb.net/CRM";
mongoose
  .connect(MD_DBR)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);

module.exports = app;
