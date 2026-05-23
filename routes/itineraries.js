const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/auth");

// FETCH ITINERARY FOR A SPECIFIC TOUR (Public / Used by Admin)
router.get("/tour/:tourId", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM tour_itineraries WHERE tour_id = ? ORDER BY day_number ASC",
            [req.params.tourId]
        );
        res.json(rows);
    } catch (error) {
        console.error("Fetch Itinerary Error:", error);
        res.status(500).json({ error: "Failed to load itinerary logs" });
    }
});

// ADD A DAY TO AN ITINERARY (Protected)
router.post("/", verifyToken, async (req, res) => {
    const { tour_id, day_number, day_title, day_description, accommodation, meals_included } = req.body;
    
    if (!tour_id || !day_number || !day_title || !day_description) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const query = `
            INSERT INTO tour_itineraries (tour_id, day_number, day_title, day_description, accommodation, meals_included)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                day_title = VALUES(day_title), 
                day_description = VALUES(day_description), 
                accommodation = VALUES(accommodation), 
                meals_included = VALUES(meals_included)
        `;
        
        await db.query(query, [
            tour_id, 
            day_number, 
            day_title, 
            day_description, 
            accommodation || 'Luxury Safari Lodge / Premium Campsite', 
            meals_included || 'Breakfast, Lunch & Dinner (B, L, D)'
        ]);
        
        res.status(201).json({ message: "Itinerary day updated/created successfully" });
    } catch (error) {
        console.error("Insert Itinerary Error:", error);
        res.status(500).json({ error: "Failed to store itinerary day tracking metric" });
    }
});

// DELETE AN INDIVIDUAL DAY FROM AN ITINERARY (Protected)
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM tour_itineraries WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Day timeline item not found" });
        }

        res.json({ message: "Itinerary day erased successfully" });
    } catch (error) {
        console.error("Delete Itinerary Day Error:", error);
        res.status(500).json({ error: "Failed to erase selected timeline node" });
    }
});

module.exports = router;