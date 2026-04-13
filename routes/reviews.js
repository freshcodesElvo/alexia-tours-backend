const express = require("express");
const router = express.Router();
const db = require("../db");

// 1. GET Approved reviews (For the Public Homepage)
router.get("/approved", async (req, res) => {
    try {
        const sql = "SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC";
        const [results] = await db.execute(sql);
        res.json(results);
    } catch (error) {
        console.error("Error fetching approved reviews:", error);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
});

// 2. POST a new review (From the Customer)
router.post("/submit", async (req, res) => {
    try {
        const { customer_name, rating, review_text, booking_id } = req.body;
        
        // We include booking_id if available to link the review to a specific trip
        const sql = "INSERT INTO reviews (customer_name, rating, review_text, booking_id, status) VALUES (?, ?, ?, ?, 'pending')";
        
        const [result] = await db.execute(sql, [customer_name, rating, review_text, booking_id || null]);
        
        res.status(201).json({ message: "Review submitted for approval!" });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "An error occurred while submitting" });
    }
});

// 3. GET all reviews (For Admin Dashboard)
router.get("/admin/all", async (req, res) => {
    try {
        // Joining with bookings lets you see the destination the review was for
        const sql = `
            SELECT r.*, b.destination 
            FROM reviews r 
            LEFT JOIN bookings b ON r.booking_id = b.id 
            ORDER BY r.created_at DESC
        `;
        const [results] = await db.execute(sql);
        res.json(results);
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        res.status(500).json({ error: "An error occurred" });
    }
});

// 4. PATCH/PUT to update status (Approve or Hide)
router.patch("/admin/status/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expecting 'approved' or 'hidden'

    try {
        const sql = "UPDATE reviews SET status = ? WHERE id = ?";
        await db.execute(sql, [status, id]);
        res.json({ message: `Review status updated to ${status}!` });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ error: "Failed to update review" });
    }
});

// 5. DELETE a review (Optional but helpful)
router.delete("/admin/delete/:id", async (req, res) => {
    try {
        await db.execute("DELETE FROM reviews WHERE id = ?", [req.params.id]);
        res.json({ message: "Review deleted permanently" });
    } catch (error) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;