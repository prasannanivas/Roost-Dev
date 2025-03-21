// server.js
require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const clientAuthRoutes = require("./routes/clientAuthRoutes");
const realtorAuthRoutes = require("./routes/realtorAuthRoutes");
const clientDocumentRoutes = require("./routes/clientDocumentRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// Routes
app.use("/client", clientAuthRoutes);
app.use("/realtor", realtorAuthRoutes);
app.use("/documents", clientDocumentRoutes);
app.use("/admin", adminRoutes);

// Example Home
app.get("/", (req, res) => {
  res.send("RealEstate Backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
