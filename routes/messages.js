const express = require("express")
const router = express.Router()
const db = require("../db")






//create message
router.post("/", async(req , res)=>{
    try{
        const {name,email,subject,message} = req.body

        await db.query(
            `INSERT INTO messages (name,email,subject,message,status,created_at) VALUES(?,?,?,?, 'unread', NOW())`,
            [name,email,subject,message]
        )


        // validation
        if (!name || !email || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        res.json({
            message:"Message sent succesfully"
        })

    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "An error occured"
        })
    }
})





//retrieve all messages
router.get("/", async(req,res)=>{
    try{
        const [rows] = await db.query(
            `
                SELECT * FROM messages ORDER BY created_at DESC
            `
        )
        res.json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "Failed to get all meassages"
        })
    }
})

//retrieve one message

router.get("/:id", async(req,res)=>{
    try{
        const [rows]=await db.query(
        `
            SELECT * FROM messages WHERE id=?
        `,
        [req.params.id]
    )
    res.json(rows[0])
    } catch(error){
        console.error(error)
        res.status(500).json({
            error: "Failed to get all meassages"
        })
    }
})

//mark as read
router.put("/:id/read", async(req, res)=>{
    try{
        await db.query(
        `
            UPDATE messages SET status = "read" WHERE id=?
        `,
        [req.params.id]
    )
    res.json({
        
            message: "marked as read"
    })
    } catch(error){
        console.error(error)
        res.status(500).json({
            error: "Failed to get all meassages"
        })
    }
})

//delete
router.delete("/:id",async(req,res)=>{
    try{
        await db.query(
            `
                DELETE FROM messages WHERE id=?,
            `,
            [req.params.id]
        )
        res.json({
            message: "message deleted"
        })

    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "Failed to get all meassages"
        })
    }
})
router.put("/read-all", async (req, res) => {
    try {
        await db.query("UPDATE messages SET status = 'read' WHERE status = 'unread'");
        res.json({ message: "All messages marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router