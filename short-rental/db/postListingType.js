import connection from "./dbConnection.js";

async function postListingType(listing_types, price, days, isLt, isSum) {
  await connection.query(
    `
    INSERT INTO 
    listing_types
    VALUES (default,?,?,?,?,?,null)
    
    `,
    [listing_types, price, days, isLt, isSum],
  );
}

export default postListingType;
