import connection from "./dbConnection.js";

async function postEditListings(house_id, listing_type) {
  await connection.query(
    `
   UPDATE listings
  SET listing_types_id =?
  WHERE house_id=?
    `,
    [listing_type, house_id]
  );
}

export default postEditListings;
