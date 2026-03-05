const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer")



//storage
const storage = multer.diskStorage(
  {
  destination:(req,file,cb) =>{
    cb(null, "uploads/");
  },
  filename: (req,file,cb)=>{
    const unique = Date.now() + "-" + file.originalname;
    cb(null,unique)
  }
  
}
)

const upload = multer({storage})


router.get("/", async (req, res) => {
  try {
    const [packages] = await db.execute(`
      SELECT 
        packages.*,
        destinations.name AS destination_name
      FROM packages
      LEFT JOIN destinations 
      ON packages.destination_id = destinations.id
      ORDER BY created_at DESC
    `);

    res.json(packages);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});


//create a package
router.post("/", upload.single("image"), async (req,res)=>{
  try{
    const{
      title,
      description,
      price,
      duration_days,
      duration_nights,
      destination_id,
    } = req.body;
    const image = req.file ? req.filename: null 

    await db.query(
      `INSERT INTO packages
      (title,
      description,
      price,
      duration_days,
      duration_nights,
      destination_id,
      image) VALUES(?,?,?,?,?,?,?)`,
      [
        title,
      description,
      price,
      duration_days,
      duration_nights,
      destination_id,
      image
      ]
    )
    res.json({message: "Package created"})
  }catch(error){
    console.error(error)
    res.status(500).json({error: "An error occured while creating a package, please try again"})
  }
})


//delete a packege
router.delete("/:id", async(req,res)=>{
  try{
    await db.query(
      `DELETE FROM packages WHERE id=?`,
      [req.params.id]
    )
    res.json({message: "Package deleted"})
  }catch (error){
    console.error(error)
    res.status(500).json({error: "An error occered while deleting a packege, please try again"})
  }
})

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, price, duration_days, duration_nights, destination_id } = req.body;
    
    // LOGIC: Only update the image if a new file was actually uploaded
    let query = `UPDATE packages SET title=?, description=?, price=?, duration_days=?, duration_nights=?, destination_id=?`;
    let params = [title, description, price, duration_days, duration_nights, destination_id];

    if (req.file) {
      query += `, image=? WHERE id=?`;
      params.push(req.file.filename, id);
    } else {
      query += ` WHERE id=?`;
      params.push(id);
    }

    await db.query(query, params);
    res.json({ message: "Package updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating package" });
  }
}); 
// GET SINGLE PACKAGE
router.get("/:id", async (req, res) => {

    try {

        const [rows] = await db.query(
            "SELECT * FROM packages WHERE id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Package not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });

    }

});

module.exports = router;
