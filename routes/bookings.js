



const express = require("express");
const router = express.Router();
const db = require("../db");
const { sendReviewRequest } = require('../utils/mailer'); 

// 1. GET ALL BOOKINGS (Updated to include payment fields)
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id, full_name, email, phone, nationality, 
                tour_name, adults, children, start_date, 
                special_requests, status, transaction_id, payment_method, created_at 
            FROM bookings 
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching bookings" });
    }
});

// 2. CREATE NEW BOOKING (Now includes Payment Tracking)
router.post("/", async (req, res) => {
    try {
        const { 
            full_name, email, phone, nationality, 
            adults, children, start_date, tour_name, 
            special_requests,
            transaction_id, // From IntaSend
            payment_method  // M-Pesa/Card
        } = req.body;

        const query = `INSERT INTO bookings 
            (full_name, email, phone, nationality, adults, children, start_date, tour_name, special_requests, status, transaction_id, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Default status is 'pending' until the webhook confirms payment
        await db.query(query, [
            full_name, email, phone, nationality, 
            adults, children, start_date, tour_name, 
            special_requests, 
            'pending', 
            transaction_id || null, 
            payment_method || 'pending'
        ]);

        res.status(201).json({ message: "Booking created successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error: " + error.message });
    }
});

// 3. UPDATE STATUS (With Email Trigger for 'completed')
router.put("/:id/status", async(req,res)=>{
    try {
        const { status } = req.body;
        const bookingId = req.params.id;

        const allowedStatus = ["pending", "confirmed", "cancelled", "completed"];
        
        if(!allowedStatus.includes(status)){
            return res.status(400).json({
                error: "Invalid status. Use pending, confirmed, cancelled, or completed"
            });
        }

        const [result] = await db.query(
            `UPDATE bookings SET status = ? WHERE id = ? `,
            [status, bookingId]
        );

        if(result.affectedRows === 0){
            return res.status(404).json({error: "Booking not found"});
        }

        // Trigger review email if status is completed
        if (status === "completed") {
            try {
                const [rows] = await db.query("SELECT full_name, email FROM bookings WHERE id = ?", [bookingId]);
                const customer = rows[0];

                if (customer && customer.email) {
                    await sendReviewRequest(customer.email, customer.full_name, bookingId);
                    console.log(`Review email sent to ${customer.email}`);
                }
            } catch (mailError) {
                console.error("Mailer Error:", mailError);
            }
        }

        res.json({
            message: status === "completed" ? "Completed & Review Sent" : "Status updated",
            bookingId,
            newStatus: status
        });

    } catch (error){
        console.error(error);
        res.status(500).json({error: "Failed to update status"});
    }
});

// 4. DELETE BOOKING
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM bookings WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;