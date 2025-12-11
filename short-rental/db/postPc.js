import connection from "./dbConnection.js";

async function postPc({ promo_code, amount, message }) {
  await connection.query(
    `
    INSERT INTO 
    promo_code
    VALUES (default,?,?,?,null)
    
    `,
    [promo_code, amount, message]
  );
}

export default postPc;
