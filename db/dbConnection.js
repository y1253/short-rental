import mysql from "mysql2/promise";

const connection = await mysql.createPool({
  host: "localhost",
  user: "yechiel",
  password: "12345",
  database: "short_rental",
  waitForConnections: true,
});

export default connection;
