import connection from "./dbConnection.js";

async function deleteListingType(id) {
  await connection.query(
    `
    UPDATE listing_types
    SET delete_at = NOW() 
    WHERE listing_types_id=?
    `,
    [id]
  );
}

export default deleteListingType;
