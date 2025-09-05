import connection from "./dbConnection.js";

async function postActiveHouse({ house_id, days }, amount) {
  const activeDate = new Date(new Date().setDate(new Date().getDate() + days));
  await connection.query(
    `
    UPDATE listings 
    SET active=?,
      delete_at=NULL
    WHERE house_id=?
    `,
    [activeDate, house_id]
  );

  const [results] = await connection.query(
    `
    INSERT INTO 
    payments
    VALUES(default,?,NOW(),?)
    `,

    [house_id, amount / 100]
  );
  return results.insertId;
}

export default postActiveHouse;
