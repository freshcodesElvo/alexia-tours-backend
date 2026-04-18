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
router.put("/:id", upload.single("image"), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (req.file) {
            // New image uploaded → use Cloudinary URL
            const image = req.file.path;
            await db.query(
                "UPDATE destinations SET name=?, description=?, image=? WHERE id=?",
                [name, description, image, req.params.id]
            );
        } else {
            // No new image → keep existing
            await db.query(
                "UPDATE destinations SET name=?, description=? WHERE id=?",
                [name, description, req.params.id]
            );
        }

        res.json({ message: "Destination updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Update failed" });
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