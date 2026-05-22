const express = require('express');
const router = express.Router();
const db = require('../db'); 
const multer = require('multer');
const path = require('path');

// Multer Setup for Blog Images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
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
        .replace(/&/g, '-and-')
        .replace(/[\s\W-]+/g, '-');
}

// 1. GET ALL BLOGS (For Frontend Grid)
router.get('/', (req, res) => {
    const sql = "SELECT id, title, slug, summary, category, image_path, created_at FROM blogs ORDER BY created_at DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. GET SINGLE BLOG BY SLUG (Excellent for SEO routing)
router.get('/:slug', (req, res) => {
    const sql = "SELECT * FROM blogs WHERE slug = ?";
    db.query(sql, [req.params.slug], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: "Blog not found" });
        res.json(results[0]);
    });
});

// 3. POST NEW BLOG (Admin Panel Action)
router.post('/create', upload.single('blog_image'), (req, res) => {
    const { title, summary, content, category } = req.body;
    const slug = generateSlug(title);
    const image_path = req.file ? `uploads/blogs/${req.file.filename}` : null;

    const sql = "INSERT INTO blogs (title, slug, summary, content, category, image_path) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [title, slug, summary, content, category, image_path], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: "An article with a similar title already exists." });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Blog posted successfully!", blogId: result.insertId });
    });
});

// 4. DELETE BLOG
router.delete('/:id', (req, res) => {
    const sql = "DELETE FROM blogs WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Article removed successfully." });
    });
});

module.exports = router;