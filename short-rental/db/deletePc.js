import connection from "./dbConnection.js";

async function deletePc(id) {
  await connection.query(
    `
    UPDATE promo_code
    SET delete_at = NOW() 
    WHERE promo_code_id=?
    `,
    [id]
  );
}

export default deletePc;
