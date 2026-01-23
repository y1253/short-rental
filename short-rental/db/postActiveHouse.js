import connection from "./dbConnection.js";

async function postActiveHouse({
  house_id,
  days,
  price=0,
  listing_type,
  promo_code,
}) {
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
    VALUES(default,?,?,?,NOW(),?)
    `,

    [house_id, listing_type, promo_code, price]
  );
  return results.insertId;
}

export default postActiveHouse;
