const express = require("express")
const router = express.Router()
const db = require("../db")
const multer = require("multer");


// STORAGE CONFIG
const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {

        const unique = Date.now() + "-" + file.originalname;
        cb(null, unique);

    }

});

const upload = multer({ storage });

//fetch destinations
router.get("/", async(req,res)=>{
    try{
        const [rows] = await db.query(
        `SELECT * FROM destinations ORDER BY created_at DESC`
        );res.json(rows)



    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "Failed to get destinations"
        })
    }
})

//getting a single destination
router.get("/:id", async(req ,res)=>{
    try{
        const [rows] = await db.query(
            `select * FROM destinations WHERE id = ?`,
            [req.params.id]
        )

        if(rows.length === 0){
            return res.status(404).json({
                error: "Destination not found"
            })
        }

        res.json(rows[0])

    }catch(error){
        res.status(500).json({error: "An error occure while fetching destination"})
    }
})

//create a destination
router.post("/", upload.single("image"),async(req,res)=>{
    try{
        const {name, description} = req.body;
        const image = req.file ? req.file.filename: null
        await db.query(
            "INSERT INTO destinations (name, description,image) VALUES(?,?,?)",
            [
                name,
                description,
                image

            ]
        )
    } catch(error){
        console.error(error)
        res.status(500).json({error: "Failed to create a destination"})

    }
})

//update destinations
router.put("/:id",upload.single("image") , async (req, res) => {
  try {
    const { name, description } = req.body;
    const image =  req.file ? req.file.filename: null

    await db.query(
      "UPDATE destinations SET name=?, description=?, image=? WHERE id=?",
      [name, description, image, req.params.id]
    );

    res.json({ message: "Destination updated" });

  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

//DElete Destination
router.delete("/:id", async(req,res)=>{
    try{
        await db.query(
        "DELETE FROM destinations WHERE id=?",
        [req.params.id]
    )
    res.json({message:"Destination deleted"})
    } catch(error){
        console.error(error)
        res.status(500).json({error: "Delete failed"})
    }
})

module.exports = router;