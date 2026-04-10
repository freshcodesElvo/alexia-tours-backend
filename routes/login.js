const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');


router.post("/", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.execute("SELECT * FROM admins WHERE username = ?", [username]);
        
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const admin = rows[0];

        // Simple password check (Update to bcrypt later!)
        if (password !== admin.password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Ensure JWT_SECRET exists in your .env
        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
            return res.status(500).json({ message: "Server configuration error" });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });

    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;