const express = require("express")
const router = express.Router()
const db = require("../db")
const multer = require("multer")

//storage configuration

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads/")
    },

    filename: (req,file,cb) =>{
        const unique = Date.now() + "-" + file.originalname;
        cb(null, unique)
    }
})

const upload = multer({storage})

//fetch all touurs
router.get("/", async(req,res)=>{
    try{
        const [rows] = await db.query(
            `SELECT * FROM tours ORDER BY created_at DESC`
        );res.json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json(
            {
                error: "failed to get tours"
            }
        )
    }


})

//getting a single destination
router.get("/:id", async(req, res)=>{
    try{
        const [rows] = await db.query(
        `
            SELECT * FROM tours WHERE id=? 
        `,
        [req.params.id]
    )
    if(rows.length === 0){
        return res.status(404).json(
            {
                message: "tour not found"
            }
        )
    }

    res.json(rows[0])

    }catch(error){
        console.error(error)
        res.status(500).json({error: "An error occured"})
    }
})

//create a tour
router.post("/", upload.single("image"),async(req,res)=>{
    try{
        const {title,description,category,price,duration,is_trending} = req.body;
        const image_path = req.file ? `./uploads/${req.file.filename}` : null

        const query = `
        INSERT INTO tours
        (title,description,category,price,duration,image_path,is_trending) 
        VALUE(?,?,?,?,?,?,?)
        `

        await db.query(query,[
            title,
            description,
            category,
            price,
            duration,
            image_path,
            is_trending ==='true' ||is_trending === true]
        )
        res.status(201).json({
            message: "tour crerateed successfully"
        })
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Failed to create tour" });
    }

})


// update tour
router.put("/:id", upload.single("image"), async(req,res)=>{
    try {
        const {title, description, category, price, duration, is_trending} = req.body;
        const image_path = req.file ? `./uploads/${req.file.filename}` : null;
        
        // Convert the string "true" to a number 1 or 0
        const trendingValue = (is_trending === 'true' || is_trending === true) ? 1 : 0;

        await db.query(
            `UPDATE tours SET title=?, description=?, category=?, price=?, duration=?, image_path=?, is_trending=? WHERE id=?`,
            // REMOVED 'is_trending' from the list below:
            [title, description, category, price, duration, image_path, trendingValue, req.params.id]
        )
        res.status(200).json({message: "tour updated successfully"})
    } catch(error) {
        console.error(error)
        res.status(500).json({error: "tour update failed"})
    }
})


//delte
router.delete("/:id", async(req,res)=>{
    try{
        await db.query(
            `
            DELETE FROM tours WHERE id=?
            `,
            [req.params.id]
        )
        res.status(200).json({message: "tour deleted succesfully"})

    }catch(error){
        console.error(error)
        res.status(500).json({error: "Delete failed"})
    }
})
module.exports = router