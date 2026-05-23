const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const verifyToken = require("../middleware/auth");

// 1. Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + file.originalname;
        cb(null, unique);
    }
});

const upload = multer({ storage });

// 2. FETCH ALL TOURS (Public)
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT * FROM tours ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ error: "Failed to get tours" });
    }
});

// 3. GET SINGLE TOUR ALONG WITH ITS ITINERARY (Public)
router.get("/:id", async (req, res) => {
    try {
        // Query A: Fetch the parent tour record
        const [rows] = await db.query(
            `SELECT * FROM tours WHERE id=?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Tour not found" });
        }
        
        const tourData = rows[0];

        // Query B: Fetch child itinerary days sorted chronologically
        const [itineraryRows] = await db.query(
            `SELECT day_number, day_title, day_description, accommodation, meals_included 
             FROM tour_itineraries 
             WHERE tour_id=? 
             ORDER BY day_number ASC`,
            [req.params.id]
        );

        // Attach the array onto our parent object safely
        tourData.itinerary = itineraryRows;

        res.json(tourData);
    } catch (error) {
        console.error("Fetch Single Error:", error);
        res.status(500).json({ error: "An error occurred fetching tour data details" });
    }
});

// 4. CREATE A TOUR (Protected)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
    try {
        const { title, description, category, price, duration, is_trending } = req.body;
        const image_path = req.file ? `./uploads/${req.file.filename}` : null;
        
        // Ensure trending is stored as 1 or 0
        const trendingValue = (is_trending === 'true' || is_trending === true) ? 1 : 0;

        const query = `
            INSERT INTO tours (title, description, category, price, duration, image_path, is_trending) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            title,
            description,
            category,
            price,
            duration,
            image_path,
            trendingValue
        ]);

        res.status(201).json({ message: "Tour created successfully" });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ error: "Failed to create tour" });
    }
});

// 5. UPDATE TOUR (Protected)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
    try {
        const { title, description, category, price, duration, is_trending } = req.body;
        const trendingValue = (is_trending === 'true' || is_trending === true) ? 1 : 0;

        // Build the dynamic query so we don't overwrite existing image with NULL
        let query = `UPDATE tours SET title=?, description=?, category=?, price=?, duration=?, is_trending=?`;
        let params = [title, description, category, price, duration, trendingValue];

        if (req.file) {
            query += `, image_path=?`;
            params.push(`./uploads/${req.file.filename}`);
        }

        query += ` WHERE id=?`;
        params.push(req.params.id);

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Tour not found" });
        }

        res.status(200).json({ message: "Tour updated successfully" });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Tour update failed" });
    }
});

// 6. DELETE TOUR (Protected)
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const [result] = await db.query(
            `DELETE FROM tours WHERE id=?`,
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Tour not found" });
        }

        res.status(200).json({ message: "Tour deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;