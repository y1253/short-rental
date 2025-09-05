import connection from "./dbConnection.js";

async function getEmail(email) {
  const [results] = await connection.query(
    `
    SELECT *
    FROM
    account
    WHERE email=?
    `,
    [email]
  );
  return results;
}

export default getEmail;
