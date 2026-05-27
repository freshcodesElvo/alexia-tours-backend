const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "alexia-tours/destinations",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
});

const upload = multer({ storage });

// Fetch all destinations
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM destinations ORDER BY created_at DESC`);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get destinations" });
    }
});

// Get single destination
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM destinations WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Destination not found" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "An error occurred while fetching destination" });
    }
});

// Create destination
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { name, description } = req.body;
        const image = req.file ? req.file.path : null; // Cloudinary returns full URL in req.file.path

        await db.query(
            "INSERT INTO destinations (name, description, image) VALUES (?, ?, ?)",
            [name, description, image]
        );

        res.json({ message: "Destination created" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create destination" });
    }
});

// Update destination
// Update destination - Safe, Defensive Implementation
router.put("/:id", upload.single("image"), async (req, res) => {
    const { id } = req.params;
    
    try {
        // 1. Fetch the absolute current state from the database first
        const [currentRows] = await db.query("SELECT name, description, image FROM destinations WHERE id = ?", [id]);
        
        if (currentRows.length === 0) {
            return res.status(404).json({ error: "Destination record not found." });
        }
        
        const existingRecord = currentRows[0];

        // 2. Fall back to existing database values if the request fields arrive blank or missing
        const finalName = req.body.name !== undefined ? req.body.name : existingRecord.name;
        const finalDescription = req.body.description !== undefined ? req.body.description : existingRecord.description;
        
        // 3. Determine image path context
        let finalImage = existingRecord.image; // Default to what is already in DB
        if (req.file) {
            finalImage = req.file.path; // Overwrite if a fresh binary file is supplied
        }

        // 4. Fire a unified UPDATE query that is completely safe
        await db.query(
            "UPDATE destinations SET name = ?, description = ?, image = ? WHERE id = ?",
            [finalName, finalDescription, finalImage, id]
        );

        res.json({ message: "Destination updated successfully without asset loss!" });
    } catch (error) {
        console.error("Critical failure during destination update operational sequence:", error);
        res.status(500).json({ error: "Internal validation update process failed." });
    }
});

// Delete destination
router.delete("/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM destinations WHERE id=?", [req.params.id]);
        res.json({ message: "Destination deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;