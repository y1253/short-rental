import connection from "./dbConnection.js";

async function getListings() {
  const [results] = await connection.query(
    `
    SELECT     
      *
    FROM listing_types
    
    `
  );

  return results;
}

export default getListings;
