// node hashPassword.js
require("dotenv").config(); // ← add this line

const bcrypt = require('bcrypt');
const db = require('./db');

async function fixPassword() {
    const newPassword = "NewPassword123"; // ← set a new password here
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute(
        "UPDATE admins SET password = ? WHERE username = ?",
        [hashed, "alexiastoursadmin"]
    );
    console.log("Password reset successfully");
    process.exit();
}

fixPassword();