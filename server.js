require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// 1. Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json()); // Must be before route handlers

// 2. Connect Database
connectDB();

// 3. Healthcheck
app.get("/", (req, res) => {
  res.json({ message: "Backend operational" });
});

// 4. API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/units", require("./routes/unitRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/rent", require("./routes/rentRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});