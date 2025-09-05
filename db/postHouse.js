import connection from "./dbConnection.js";

async function postHouse(post) {
  await connection.query("START TRANSACTION;");
  const { account_id, area, state } = post;

  const [results] = await connection.query(
    `
    INSERT INTO 
    house
    VALUES (default,?,?,?,0)
    `,
    [account_id, area, state]
  );

  const { description, price, from, until } = post;
  await connection.query(
    `
    INSERT INTO 
    house_info
    VALUES (default,(SELECT MAX(house_id) FROM house),?,?,?,?)
    `,
    [description, price, from, until]
  );

  const { bed, bath, shower, people, crib } = post;
  await connection.query(
    `
    INSERT INTO 
    icon_details
    VALUES (default,(SELECT MAX(house_id) FROM house),?,?,?,?,?)
    `,
    [bed, bath, shower, people, crib]
  );

  const { pictures } = post;
  for (let picture of pictures) {
    await connection.query(
      `
        INSERT INTO 
        pictures
        VALUES (default,(SELECT MAX(house_id) FROM house),?)
        `,
      [picture]
    );
  }

  const { contact_info } = post;
  for (let contact of contact_info) {
    await connection.query(
      `
        INSERT INTO 
        contact_info
        VALUES (default,(SELECT MAX(house_id) FROM house),?)
        `,
      [contact]
    );
  }

  const { rental_type } = post;
  for (let type of rental_type) {
    await connection.query(
      `
        INSERT INTO 
        rental_type
        VALUES (default,(SELECT MAX(house_id) FROM house),?)
        `,
      [type]
    );
  }

  await connection.query("COMMIT;");

  return results.insertId;
}

export default postHouse;
