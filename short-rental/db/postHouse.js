import connection from "./dbConnection.js";

async function postHouse(post) {
  await connection.query("START TRANSACTION;");
  const { account_id, isLt, area, state } = post;

  const [results] = await connection.query(
    `
    INSERT INTO 
    house
    VALUES (default,?,?,?,?,0)
    `,
    [account_id, isLt, area, state]
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

  if (!isLt) {
    const { description, price, from, until } = post;
    await connection.query(
      `
    INSERT INTO 
    house_info
    VALUES (default,(SELECT MAX(house_id) FROM house),?,?,?,?)
    `,
      [description, price, from, until]
    );

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
  } else {
    const { lt_type=1,area_id, state, city, zip,address, apt } = post;
    console.log(address);
    
    await connection.query(
      `
      INSERT INTO lt_house VALUES(DEFAULT,(SELECT MAX(house_id) FROM house),?,?,?,?,?,?,? )
      `,
      [lt_type,area_id, state, city, zip, address, apt]
    );

    const { rent, contract_info, description, broker_name } = post;
    await connection.query(
      `
      INSERT INTO lt_house_info VALUES (DEFAULT,(SELECT MAX(house_id) FROM house),?,?,?,?)
      `,
      [rent, contract_info, description, broker_name]
    );
  }
  await connection.query("COMMIT;");

  await connection.query(`
    INSERT INTO listings VALUES(DEFAULT,?,NOW(),NULL,NULL)
    `,[results.insertId])

  return results.insertId;
}

export default postHouse;
