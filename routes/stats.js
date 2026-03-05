const express = require("express")
const router = express.Router()
const db = require("../db");
const { route } = require("./packages");



// --- DASHBOARD STATS ROUTE ---
router.get("/", async (req, res) => {
    try {
        // 1. Get count of unread messages
        const [msgResult] = await db.query("SELECT COUNT(*) as total FROM messages WHERE status = 'unread'");
        
        // 2. Get count of hotels
        const [hotelResult] = await db.query("SELECT COUNT(*) as total FROM hotels");
        
        // 3. Get count of visa services
        const [visaResult] = await db.query("SELECT COUNT(*) as total FROM visa_services");
        
        // 4. Get the 5 most recent messages
        const [recentMsgs] = await db.query("SELECT name, subject, created_at FROM messages ORDER BY created_at DESC LIMIT 5");

        // Send everything back as one JSON object
        res.json({
            unreadMessages: msgResult[0].total,
            totalHotels: hotelResult[0].total,
            totalVisas: visaResult[0].total,
            recentMessages: recentMsgs
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
module.exports = router;