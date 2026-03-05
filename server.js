require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();  

const db = require("./db");

const packageRoutes = require("./routes/packages");
const bookingRoutes = require("./routes/bookings");
const destinationRoutes = require("./routes/destinations");
const hotelRoutes = require("./routes/hotels")
const visaRoutes = require("./routes/visaServices")
const messageRoutes = require("./routes/messages")
const statsRoutes = require("./routes/stats")
const toursRoutes = require("./routes/tours")
const hotelBookingRoutes = require("./routes/hotelBookings")

// Middleware
app.use(cors());
app.use(express.json());

//  routes
app.use("/api/packages", packageRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/destinations", destinationRoutes)
app.use("/uploads", express.static("uploads"));
app.use("/api/hotels", hotelRoutes)
app.use("/api/visa-services", visaRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/stats", statsRoutes)
app.use("/api/tours", toursRoutes)
app.use("/api/hotel-bookings", hotelBookingRoutes)


const cors = require('cors');

// Allow your GitHub Pages URL to talk to this API
app.use(cors({
    origin: 'https://freshcodeselvo.github.io/', // Replace with your actual GitHub Pages URL
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

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
      message: "Database connection failed" 
    });
  }
});

app.get("/", (req, res) => {
    res.send("Alexia Tours Backend is running ✅");
});
// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





