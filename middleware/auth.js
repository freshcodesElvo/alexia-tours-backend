const jwt = require('jsonwebtoken')
const verifyToken = (req,res, next)=>{
    const authHeader= req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(!token){
        return res.status(403).json({message:"Access denied: No token provided"})

    }
    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.adminId  = decoded.id;
        next()

    }catch(error){
        return res.status(401).json({message:"Unauthorized access"})
    }

}
module.exports = verifyToken;