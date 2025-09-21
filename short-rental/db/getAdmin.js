import connection from "./dbConnection.js";

async function getAdmin(id) {
  const [results] = await connection.query(
    `
    SELECT *
    FROM
    admin
    WHERE account_id=?
    
    `,
    [id]
  );
  return results;
}

export default getAdmin;
