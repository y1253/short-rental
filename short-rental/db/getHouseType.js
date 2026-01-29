import connection from "./dbConnection.js";

async function getHouseType() {
  const [results] = await connection.query(
    `SELECT * FROM house_type
    
    `,
  );

  return results;
}

export default getHouseType;
