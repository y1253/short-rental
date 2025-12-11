import connection from "./dbConnection.js";

async function getListingTypeById(id) {
  const [results] = await connection.query(
    `
    SELECT *
    FROM
    listing_types
    WHERE listing_types_id=? AND delete_at IS NULL
    `,
    [id]
  );
  return results[0];
}

export default getListingTypeById;
