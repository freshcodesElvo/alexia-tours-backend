require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();  
const db = require("./db");

// 1. Correct CORS Middleware (ONLY USE THIS ONCE)
app.use(cors({
    origin: ['https://freshcodeselvo.github.io', 'http://127.0.0.1:5500'], // Allows both GitHub and local testing
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// Import Routes
const packageRoutes = require("./routes/packages");
const bookingRoutes = require("./routes/bookings");
const destinationRoutes = require("./routes/destinations");
const hotelRoutes = require("./routes/hotels");
const visaRoutes = require("./routes/visaServices");
const messageRoutes = require("./routes/messages");
const statsRoutes = require("./routes/stats");
const toursRoutes = require("./routes/tours");
const hotelBookingRoutes = require("./routes/hotelBookings");

// Use Routes
app.use("/api/packages", packageRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/hotels", hotelRoutes);
app.use("/api/visa-services", visaRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/tours", toursRoutes);
app.use("/api/hotel-bookings", hotelBookingRoutes);

// Test database route
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT 1");
    res.json({
      message: "Database connected successfully",
      result: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Database connection failed",
      error: error.message
    });
  }
});

app.get("/", (req, res) => {
    res.send("Alexia Tours Backend is running ✅");
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});