import connection from "./dbConnection.js";

async function getListingsById(id) {
  const [results] = await connection.query(
    `
   SELECT 
  *
  FROM listings
    WHERE house_id=?
    `,
    [id]
  );

  return results;
}

export default getListingsById;
