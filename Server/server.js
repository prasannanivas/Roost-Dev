// server.js
require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

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

app.get("/download-template-client", (req, res) => {
  const templatePath = path.join(
    __dirname,
    "templates",
    "client_invite_template.csv"
  );
  res.download(templatePath, "client_invite_template.csv", (err) => {
    if (err) {
      return res.status(500).json({ error: "Error downloading template file" });
    }
  });
});

// Ping endpoint
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Example Home
app.get("/", (req, res) => {
  res.send("RealEstate Backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
