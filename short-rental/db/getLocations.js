import connection from "./dbConnection.js";

async function getLocations() {
  const [results] = await connection.query(
    `
    SELECT     
      DISTINCT area
    FROM house
    JOIN listings ls
      USING (house_id)
    WHERE active >= NOW()
    
    `
  );

  return results;
}

export default getLocations;
