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
        folder: "alexia-tours/packages",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
});

const upload = multer({ storage });

// Get all packages
router.get("/", async (req, res) => {
    try {
        const [packages] = await db.execute(`
            SELECT 
                packages.*,
                destinations.name AS destination_name
            FROM packages
            LEFT JOIN destinations 
            ON packages.destination_id = destinations.id
            ORDER BY created_at DESC
        `);
        res.json(packages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch packages" });
    }
});

// Get single package
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM packages WHERE id = ?", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Package not found" });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Create a package
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { title, description, price, duration_days, duration_nights, destination_id } = req.body;
        const image = req.file ? req.file.path : null;

        await db.execute(
            `INSERT INTO packages (title, description, price, duration_days, duration_nights, destination_id, image) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description, price, duration_days, duration_nights, destination_id, image]
        );

        res.json({ message: "Package created successfully" });
    } catch (error) {
        console.error("Create Error:", error);
        res.status(500).json({ error: "An error occurred while creating a package" });
    }
});

// Update a package
router.put("/:id", upload.single("image"), async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description, price, duration_days, duration_nights, destination_id } = req.body;

        if (req.file) {
            await db.query(
                `UPDATE packages SET title=?, description=?, price=?, duration_days=?, duration_nights=?, destination_id=?, image=? WHERE id=?`,
                [title, description, price, duration_days, duration_nights, destination_id, req.file.path, id]
            );
        } else {
            await db.query(
                `UPDATE packages SET title=?, description=?, price=?, duration_days=?, duration_nights=?, destination_id=? WHERE id=?`,
                [title, description, price, duration_days, duration_nights, destination_id, id]
            );
        }

        res.json({ message: "Package updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating package" });
    }
});

// Delete a package
router.delete("/:id", async (req, res) => {
    try {
        await db.query(`DELETE FROM packages WHERE id=?`, [req.params.id]);
        res.json({ message: "Package deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while deleting a package" });
    }
});

module.exports = router;