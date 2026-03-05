const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", async (req, res) => {
    try {
        // 1. Destructure the data from the request body (sent from booking.js)
        const { 
            full_name, 
            email, 
            phone, 
            nationality, 
            adults, 
            children, 
            start_date, 
            tour_name, 
            special_requests 
        } = req.body;

        // 2. Update the query to use the NEW column names
        const query = `INSERT INTO bookings 
            (full_name, email, phone, nationality, adults, children, start_date, tour_name, special_requests) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // 3. Execute the query
        await db.query(query, [
            full_name, 
            email, 
            phone, 
            nationality, 
            adults, 
            children, 
            start_date, 
            tour_name, 
            special_requests
        ]);

        res.status(201).json({ message: "Booking created successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error: " + error.message });
    }
});


router.get("/", async (req, res) => {
    try {
        // Updated column names: nationality, tour_name, start_date, adults, children, special_requests
        const [rows] = await db.query(`
            SELECT 
                id, full_name, email, phone, nationality, 
                tour_name, adults, children, start_date, 
                special_requests, status, created_at 
            FROM bookings 
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching bookings" });
    }
});

router.get("/:id", async(req,res)=>{
    try{
        const[rows] = await db.query(
        `SELECT * FROM bookings WHERE id = ?`,
            [req.params.id]
        )
        if(rows.length === 0){
            return res.status(404).json({error: "Booking not found"});
        }
        res.json(rows[0])
        
    } catch (error){
        console.error(error);
        res.status(500).json({error: "An error occured while fetching booking "})
    }
})
router.put("/:id/status", async(req,res)=>{
    try{
        const{status} = req.body;
        const bookingId = req.params.id;

        //validate stauts
        const allowedStatus = ["pending","confirmed", "cancelled"]
        if(!allowedStatus.includes(status)){
            return res.status(400).json({
                error: "Invalid status. Use pending, confirmed, or cancelled"
            })
        }

        const [result] = await db.query(
            `UPDATE bookings SET status = ? WHERE id = ? `,
            [status,bookingId]
        );
        if(result.affectedRows ===0){
            return res.status(404).json({error: "Booking not found"})
        }

        res.json({
            message: "Booking status updated successfully",
            bookingId,
            newStatus:status
        })
    } catch (error){
        console.error(error)
        res.status(500).json({error: "Failed to update booking status"})
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM bookings WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json({ message: "Booking deleted successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete booking" });
    }
});
module.exports = router;