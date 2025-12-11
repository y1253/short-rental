import connection from "./dbConnection.js";

async function getPromoCodeById(id) {
  const [results] = await connection.query(
    `
    SELECT *
    FROM
    promo_code
    WHERE promo_code_id=? AND delete_at IS NULL
    
    `,
    [id]
  );
  return results[0];
}

export default getPromoCodeById;
