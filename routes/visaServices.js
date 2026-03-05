const express = require("express")
const multer = require("multer")
const router = express.Router()
const db = require("../db")
const { route } = require("./hotels")

//storage
const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, "uploads/")
    },
    filename: (req,file,cb)=>
    {
        const unique = Date.now()+ "-"+file.originalname
        cb(null,unique)

    }
})

const upload = multer({storage})

//getting all visa services
router.get("/", async(req,res)=>{
    try{
        const [rows] = await db.query(
            `SELECT * FROM visa_services ORDER BY id DESC`
        )
        res.json(rows)

    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "An error occured while searching for visa services"
        })
    }
})


//getting a single service
router.get("/:id", async(req,res)=>{
    try{
        const [rows] = await db.query(
            `SELECT * FROM visa_services WHERE id=?`,
            [req.params.id]

        )
        if(rows.length === 0){
            return res.status(404).json({
                message: "ooppss, service not found"
            })
        }
        res.json(rows[0])

    }catch (error){
        console.error(error)
        res.status(500).json({
            error: "An error occured while searching for a service"
        })
    }
})

//create a visa service
router.post("/", upload.single("image"), async(req,res)=>{
    const {country, visa_type,processing_time, price, description,status}= req.body
    const image = req.file ? req.file.filename:null
    await db.query(
        `INSERT INTO visa_services (country,visa_type,processing_time,price,description,image,status) VALUES(?,?,?,?,?,?,?)`,
        [country,visa_type,processing_time,price,description,image,status]
    )
    res.json({message: "visa service created"})

})

//editing a service
router.put("/:id", upload.single("image"), async(req,res)=>{
    try{
        const {country,visa_type,processing_time,price,description,status} =req.body
        const image = req.file ? req.file.filename : null

        if(image){
            await db.query(
                `UPDATE visa_services SET country=?, visa_type=?, processing_time=?, price=?, description=?, image=?,status=? WHERE id=?`,
                [country,visa_type,processing_time,price,description,image,status,req.params.id]
            )
        }else{
            await db.query(
                "UPDATE visa_services SET country=?, visa_type=?, processing_time=?, price=?, description=?, status=? WHERE id=?",
            [country, visa_type, processing_time, price, description, status, req.params.id]
            )
        }
        res.json(
            {
                message: "visa service updated succesfully"
            }
        )


    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "An error occure while editing a visa service"
        })
    }
})

//deteing a visa service
router.delete("/:id", async(req,res)=>{
    try{
        await db.query(
            `
            DELETE FROM visa_services WHERE id=?
            `,
            [req.params.id]
        )
        res.json({
            message: "success"
        })

    }catch(error){
        console.error(error)
        res.status(500).json({
            error: "An error occured while deleting a serviqce"
        })
    }
})

module.exports = router;