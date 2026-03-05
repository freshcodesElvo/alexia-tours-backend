// const mysql = require("mysql2");

// const connection = mysql.createPool({
//   host: process.env.DB_HOST || "127.0.0.1",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD, // No default for security
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT || 3306, // This is the DB port, NOT the server port
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// module.exports = connection.promise();

const mysql = require("mysql2");

const connection = mysql.createPool({
  // Railway uses MYSQLHOST, your local might use DB_HOST or 127.0.0.1
  host: process.env.MYSQLHOST || process.env.DB_HOST || "127.0.0.1",
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "", 
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = connection.promise();