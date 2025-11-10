import connection from "./dbConnection.js";

async function postListingType(listing_types, price, days,isLt) {
  await connection.query(
    `
    INSERT INTO 
    listing_types
    VALUES (default,?,?,?,?,null)
    
    `,
    [listing_types, price, days,isLt]
  );
}

export default postListingType;
