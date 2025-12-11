import connection from "./dbConnection.js";

async function getPromoCodeByPc(promo_code) {
  const [results] = await connection.query(
    `
    SELECT *
    FROM
   promo_code
    WHERE promo_code=?
    
    `,
    [promo_code]
  );
  return results[0];
}

export default getPromoCodeByPc;
