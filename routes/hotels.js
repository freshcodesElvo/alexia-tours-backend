const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const fs = require('fs');

//storage configuraration

// Auto-create uploads folder if it's missing
if (!fs.existsSync("uploads/")) {
    fs.mkdirSync("uploads/");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        // We use filename to ensure we save the unique string to the DB
        const unique = Date.now() + "-" + file.originalname;
        cb(null, unique);
    }
});

const upload = multer({ storage });



//get all hotels
router.get("/", async(req,res)=>{
    try{
        const [rows] = await db.query(
            `SELECT * FROM hotels ORDER BY id DESC`
        )
        res.json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: "An error occured"})
    }
})

//geting a single hotell
router.get("/:id", async(req,res)=>{
    try{
        const [rows] = await db.query(
            `SELECT * FROM hotels WHERE id=?`,
            [req.params.id]
        )
        if(rows.length === 0){
            return res.status(404).json(
                {
                    error: "Hotel not found"
                }
            )
        }
        res.json(rows[0])

    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "An error occure while searching for a hotel"
        })
    }
})

//creating a new hotell
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { name, location, price, description } = req.body;
        const image = req.file ? req.file.filename : "default.jpg"; // Fallback image

        // Ensure price is treated as a number
        const numericPrice = parseFloat(price) || 0;

        await db.query(
            `INSERT INTO hotels (name, location, price, description, image) VALUES(?,?,?,?,?)`,
            [name, location, numericPrice, description, image]
        );
        
        res.json({ message: "Hotel created successfully" });
    } catch (error) {
        console.error("DATABASE ERROR:", error); // This prints the REAL error to your terminal
        res.status(500).json({ error: error.message });
    }
});

//edit a  hotel
router.put("/:id", upload.single("image"), async(req, res)=>{
    try{
        const {name, location,price,description} = req.body
        const image = req.file ? req.file.filename : null;
        if(image){
            await db.query(
                `UPDATE hotels SET name=?, location=?, price=?,description=?,image=? WHERE id=?`,
                [name, location,price,description,image,req.params.id]
            )
        }else{
            await db.query(
                `UPDATE hotels SET name=?, location=?, price=?, description=? WHERE id=?`,
                [name,location,price,description,req.params.id]

            )
        }
        res.json({
            message: "Hotel updated successfully"
        })


    } catch(error){
        console.error(error)
        res.status(500).json(
            {
                error: "An error occured while editing a hotel"
            }
        )
    }
}) 
//delete a hotel
router.delete("/:id", async(req,res)=>{
    try{
        await db.query(
            `DELETE FROM hotels WHERE id=?`,
            [req.params.id]
        )
        res.json({
            message: "hotel deleted successfully"
        })

    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "An error occure while deleting a hotel"
        })

    }
})
module.exports = router