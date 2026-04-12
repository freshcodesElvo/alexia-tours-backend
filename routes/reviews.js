const express = require("express");
const router = express.Router();
const db = require("../db");

// GET Approved reviews
router.get("/approved", (req, res) => {
    try {
        const sql = "SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC";
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results); // ADDED THIS LINE
        });
    } catch (error) {
        console.error("An error occurred", error);
        res.status(500).json({ error: "An error occurred" });
    }
});

// POST a new review (Crucial fix: changed .get to .post)
router.post("/submit", async (req, res) => { // Added async
    console.log("POST request received at /submit!");
    console.log("Body:", req.body);

    try {
        const { customer_name, rating, review_text } = req.body;
        const sql = "INSERT INTO reviews (customer_name, rating, review_text, status) VALUES (?, ?, ?, 'pending')";
        
        // Use await db.execute instead of db.query
        const [result] = await db.execute(sql, [customer_name, rating, review_text]);
        
        console.log("Database Insert Success:", result);
        res.status(201).json({ message: "review submitted for approval!" });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "An error occurred while submitting" });
    }
});

// GET all for admin
router.get("/admin/all", (req, res) => {
    try {
        const sql = "SELECT * FROM reviews ORDER BY created_at DESC";
        db.query(sql, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred" });
    }
});

// PUT to approve
router.put('/approve/:id', (req, res) => {
    try {
        const { id } = req.params;
        const sql = "UPDATE reviews SET status = 'approved' WHERE id = ?";
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Review approved!" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred" });
    }
});

module.exports = router;