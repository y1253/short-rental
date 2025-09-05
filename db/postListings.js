import connection from "./dbConnection.js";

async function postListings(house_id, listing_type) {
  await connection.query(
    `
    INSERT INTO 
    listings
    VALUES (default,?,?,NOW(),null,null)
    
    `,
    [house_id, listing_type]
  );
}

export default postListings;
