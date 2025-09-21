import connection from "./dbConnection.js";

async function getAllAccounts(id) {
  const [results] = await connection.query(
    `
    SELECT *
    FROM
    account
    
    
    `
  );
  return results;
}

export default getAllAccounts;
