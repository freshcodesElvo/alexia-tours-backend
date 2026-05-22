const express = require('express');
const router = express.Router();
const db = require('../db'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import Node's filesystem module

// 1. Ensure upload directories exist safely in production
const uploadDir = path.join(__dirname, '../uploads/blogs/');
if (!fs.existsSync(uploadDir)) {
    // recursive: true ensures it builds both /uploads and /uploads/blogs if missing
    fs.mkdirSync(uploadDir, { recursive: true }); 
}

// 2. Multer Setup for Blog Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use the safe directory path
        cb(null, 'uploads/blogs/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Helper function to generate clean SEO slugs
function generateSlug(text) {
    return text.toString().toLowerCase().trim()
        .replace(/'/g, '')         
        .replace(/&/g, '-and-')     
        .replace(/[\s\W-]+/g, '-'); 
}

// ... the rest of your routes (GET, POST, DELETE) stay exactly the same ...
// 1. GET ALL BLOGS (For Frontend Grid)
router.get('/', async (req, res) => {
    const sql = "SELECT id, title, slug, summary, category, image_path, created_at FROM blogs ORDER BY created_at DESC";
    try {
        const [results] = await db.execute(sql);
        res.json(results);
    } catch (err) {
        console.error("Error fetching blogs:", err);
        res.status(500).json({ error: err.message });
    }
});

// 2. GET SINGLE BLOG BY SLUG
router.get('/:slug', async (req, res) => {
    const sql = "SELECT * FROM blogs WHERE slug = ?";
    try {
        const [results] = await db.execute(sql, [req.params.slug]);
        if (results.length === 0) {
            return res.status(404).json({ message: "Blog not found" });
        }
        res.json(results[0]);
    } catch (err) {
        console.error("Error fetching single blog:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. POST NEW BLOG (Admin Panel Action)
router.post('/create', upload.single('blog_image'), async (req, res) => {
    const { title, summary, content, category } = req.body;
    const slug = generateSlug(title);
    const image_path = req.file ? `uploads/blogs/${req.file.filename}` : null;

    const sql = "INSERT INTO blogs (title, slug, summary, content, category, image_path) VALUES (?, ?, ?, ?, ?, ?)";
    try {
        const [result] = await db.execute(sql, [title, slug, summary, content, category, image_path]);
        res.status(201).json({ message: "Blog posted successfully!", blogId: result.insertId });
    } catch (err) {
        console.error("Error creating blog:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "An article with a similar title already exists." });
        }
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE BLOG
router.delete('/:id', async (req, res) => {
    const sql = "DELETE FROM blogs WHERE id = ?";
    try {
        await db.execute(sql, [req.params.id]);
        res.json({ message: "Article removed successfully." });
    } catch (err) {
        console.error("Error deleting blog:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;