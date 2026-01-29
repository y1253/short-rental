import connection from "./dbConnection.js";

async function getSummerTime() {
  const [results] = await connection.query(
    `SELECT * FROM summer_time
    
    `,
  );

  return results;
}

export default getSummerTime;
