import connection from "./dbConnection.js";

async function postEditHouseById(post) {
  // await connection.query("START TRANSACTION;");
  
const {isLt,house_id}=post;
  if(isLt){
    const {lt_type=1,area_id, state , city ,zip, address, apt}=post;
    await connection.query(
      `
      DELETE FROM lt_house WHERE house_id=?
      
      `,
      [house_id]
    );
    await connection.query(
      `
      
      INSERT INTO 
      lt_house
      VALUES (default,?,?,?,?,?,?,?,?)
      `,
      [house_id, lt_type,area_id, state , city ,zip, address, apt]
    );

    const {price,contract_info,description,broker_name}=post;
    await connection.query(
      `
      DELETE FROM lt_house_info WHERE house_id=?
      
      `,
      [house_id]
    );
    await connection.query(
      `
      
      INSERT INTO 
      lt_house_info
      VALUES (default,?,?,?,?,?)
      `,
      [house_id,price,contract_info,description,broker_name]
    );
  
  }
  else{
    const { house_id, area, state } = post;

  const [results] = await connection.query(
    `
     UPDATE house
    SET area=?,state=?
        WHERE house_id =?
    `,
    [area, state, house_id]
  );

    const { description, price, from, until } = post;
    await connection.query(
      `
      DELETE FROM house_info WHERE house_id=?
      
      `,
      [house_id]
    );
    await connection.query(
      `
      
      INSERT INTO 
      house_info
      VALUES (default,?,?,?,?,?)
      `,
      [house_id, description, price, from, until]
    );

    const { rental_type } = post;
  await connection.query(
    `
    DELETE FROM rental_type WHERE house_id=?
    
    `,
    [house_id]
  );
  for (let type of rental_type) {
    await connection.query(
      `
        INSERT INTO 
        rental_type
        VALUES (default,?,?)
        `,
      [house_id, type]
    );
  }
  }

  const { bed, bath, shower, people, crib } = post;
  await connection.query(
    `
    DELETE FROM icon_details WHERE house_id=?
    
    `,
    [house_id]
  );
  await connection.query(
    `
    INSERT INTO 
    icon_details
    VALUES (default,?,?,?,?,?,?)
    `,
    [house_id, bed, bath, shower, people, crib]
  );

  const { pictures } = post;

  await connection.query(
    `
    DELETE FROM pictures WHERE house_id=?
    
    `,
    [house_id]
  );
  for (let picture of pictures) {
    await connection.query(
      `
        INSERT INTO 
        pictures
        VALUES (default,?,?)
        `,
      [house_id, picture]
    );
  }

  const { contact_info } = post;
  await connection.query(
    `
    DELETE FROM contact_info WHERE house_id=?
    
    `,
    [house_id]
  );
  for (let contact of contact_info) {
    await connection.query(
      `
        INSERT INTO 
        contact_info
        VALUES (default,?,?)
        `,
      [house_id, contact]
    );
  }

  

  // await connection.query("COMMIT;");

  return house_id;
}

export default postEditHouseById;
