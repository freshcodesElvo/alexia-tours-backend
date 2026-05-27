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

// 2. GET SINGLE BLOG BY ID (For Admin Pre-populating Edit Modal Context)
router.get('/:id', async (req, res) => {
    // Check if the parameter is a numeric ID; if it's not a number, pass it downstream to the slug route
    if (isNaN(req.params.id)) return next(); 

    const sql = "SELECT * FROM blogs WHERE id = ?";
    try {
        const [results] = await db.execute(sql, [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ message: "Journal entry not found" });
        }
        res.json(results[0]);
    } catch (err) {
        console.error("Error fetching blog by ID:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. GET SINGLE BLOG BY SLUG (Fallback Frontend Public Link Routing)
// CHANGE THIS: Added 'next' as the third argument context
router.get('/:id', async (req, res, next) => {
    // If the parameter is a slug string (not a number), drop out and pass control down
    if (isNaN(req.params.id)) return next(); 

    const sql = "SELECT * FROM blogs WHERE id = ?";
    try {
        const [results] = await db.execute(sql, [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ message: "Journal entry not found" });
        }
        res.json(results[0]);
    } catch (err) {
        console.error("Error fetching blog by ID:", err);
        res.status(500).json({ error: err.message });
    }
});

// 4. POST NEW BLOG (Admin Panel Action)
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

// 5. UPDATE EXISTING BLOG DATA RECORD (Admin Save Mutation Changes Action)
router.put('/:id', async (req, res) => {
    const { title, summary, content, category, imageUrl } = req.body;
    const { id } = req.params;
    
    // Dynamically recompute the clean URL reference slug strings based on modifications
    const updatedSlug = generateSlug(title);

    // Keep the incoming manually referenced image fallback path link string value if no fresh asset payload uploads
    const sql = `
        UPDATE blogs 
        SET title = ?, slug = ?, summary = ?, content = ?, category = ?, image_path = ? 
        WHERE id = ?
    `;
    
    try {
        const [result] = await db.execute(sql, [title, updatedSlug, summary, content, category, imageUrl, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Target operational database entry could not be identified." });
        }
        
        res.json({ message: "Blog publication metrics successfully saved and deployed live!" });
    } catch (err) {
        console.error("Database tracking context error modifying entry metadata:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Modifying this title clashes with an alternate matching destination asset record URL slug index." });
        }
        res.status(500).json({ error: err.message });
    }
});

// 6. DELETE BLOG
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