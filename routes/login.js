// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const db = require('../db');


// router.post("/", async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const [rows] = await db.execute("SELECT * FROM admins WHERE username = ?", [username]);
        
//         if (rows.length === 0) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }

//         const admin = rows[0];

//         // Simple password check (Update to bcrypt later!)
//         if (password !== admin.password) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }

//         // Ensure JWT_SECRET exists in your .env
//         if (!process.env.JWT_SECRET) {
//             console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
//             return res.status(500).json({ message: "Server configuration error" });
//         }

//         const token = jwt.sign(
//             { id: admin.id, username: admin.username },
//             process.env.JWT_SECRET,
//             { expiresIn: '24h' }
//         );

//         res.json({ token });

//     } catch (error) {
//         console.error("Database Error:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db');


// =======================
// 🔑 LOGIN
// =======================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM admins WHERE username = ?",
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const admin = rows[0];

        // 🔒 Compare hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 🔑 Access Token (15 min)
        const accessToken = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // 🔄 Refresh Token (7 days)
        const refreshToken = jwt.sign(
            { id: admin.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // 💾 Save refresh token in DB
        await db.execute(
            "INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)",
            [admin.id, refreshToken]
        );

        res.json({
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// =======================
// 🔄 REFRESH TOKEN
// =======================
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }

    try {
        // Check if token exists in DB
        const [rows] = await db.execute(
            "SELECT * FROM refresh_tokens WHERE token = ?",
            [refreshToken]
        );

        if (rows.length === 0) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // Verify refresh token
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Expired or invalid refresh token" });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.json({ accessToken: newAccessToken });
        });

    } catch (error) {
        console.error("Refresh Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// =======================
// 🚪 LOGOUT
// =======================
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required" });
    }

    try {
        await db.execute(
            "DELETE FROM refresh_tokens WHERE token = ?",
            [refreshToken]
        );

        res.json({ message: "Logged out successfully" });

    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = router;