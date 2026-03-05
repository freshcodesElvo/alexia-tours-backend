const db = require("./db");

async function test() {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Connection error:", error.message);
  }
}

test();
