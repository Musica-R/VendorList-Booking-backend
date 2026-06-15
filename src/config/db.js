import mysql from "mysql2";

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Musica@123",
  database: "lokal_service_booking",
  connectionLimit: 10,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("Database Connection Failed:", err);
  } else {
    console.log("MySQL Pool Connected Successfully");
    connection.release();
  }
});

export default db;