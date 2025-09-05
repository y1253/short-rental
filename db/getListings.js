import connection from "./dbConnection.js";

async function getListings() {
  const [results] = await connection.query(
    `
    SELECT     
      *
    FROM listing_types
    WHERE delete_at is null
    
    
    `
  );

  return results;
}

export default getListings;
