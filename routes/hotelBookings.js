const express = require("express")
const router = express.Router();
const db = require("../db")

//post
router.post("/", async(req, res)=>{
    try{
        const {
        hotel_id, 
        customer_name, 
        customer_email, 
        check_in, 
        check_out, 
        room_type, 
        guests, 
        message
        } = req.body;
        await db.query(
            `INSERT INTO hotel_bookings
            (hotel_id, customer_name, customer_email, check_in, check_out,room_type, guests, message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [hotel_id, customer_name, customer_email, check_in, check_out,room_type, guests, message]
        )
        if(!hotel_id || !customer_name || !customer_email || !check_in || !check_out || !room_type || !guests || !message){
            res.status(400).json({
                message: "All fields required"
            })

        }
        res.status(200).json({
            success: true,
            message:"Booking request saved!!",
            bookingId: "result.insertId"
        })


    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "An error occured"
        })
    }
})
// GET: Fetch all bookings with hotel names for the Admin Panel
router.get('/admin/all', async (req, res) => {
    try {
        const query = `
            SELECT 
                hb.*, 
                h.name as hotel_name 
            FROM hotel_bookings hb
            JOIN hotels h ON hb.hotel_id = h.id
            ORDER BY hb.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});
module.exports = router;

