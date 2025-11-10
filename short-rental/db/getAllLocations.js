import connection from "./dbConnection.js";

async function getAllLocations() {
  const [results] = await connection.query(
    `
    SELECT     
      DISTINCT area
    FROM house
    JOIN listings ls
      USING (house_id)
    WHERE area IS NOT NULL
    
    
    `
  );

  return results;
}

export default getAllLocations;