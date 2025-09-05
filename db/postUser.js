import connection from "./dbConnection.js";

async function postUser({
  first_name,
  last_name,
  email,
  password,
  auth_type = "reg",
}) {
  await connection.query(
    `
    INSERT INTO 
    account
    VALUES (default,?,?,?,?,?)
    `,
    [first_name, last_name, email, password, auth_type]
  );
}

export default postUser;
