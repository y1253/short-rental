import mysql from "mysql2/promise";
import 'dotenv/config'

const connection = await mysql.createPool({
  host: "localhost",
  user: process.env.DB_USER_NAME,
  password: process.env.DB_PASSWORD,
  database: "short_rental",
  waitForConnections: true,
});

export default connection;
