import connection from "./dbConnection.js";

async function getPc() {
  const [results] = await connection.query(
    `
    SELECT     
      *
    FROM promo_code
    
    WHERE delete_at IS NULL
    
    
    `
  );

  return results;
}

export default getPc;
