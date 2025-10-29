import connection from "./dbConnection.js";

async function getSelectLocations() {
  const [results] = await connection.query(
    `
    SELECT     
     *
    FROM area
    
    
    
    `
  );

  return results;
}

export default getSelectLocations;
