import connection from "./dbConnection.js";
import location from "../functions/getHostLocation.js";
import getIsLt from "./getIsLt.js";

async function getHouseById(id) {
  let results = [];

  if (!(await getIsLt(id))) {
    [results] = await connection.query(
      `
   SELECT 
  house_id,
  h.is_lt,
  state,
  area,
  hi.description,
  hi.price,
  hi.from,
  hi.until,
  id.bed,
  id.bath,
  id.crib,
  id.shower,
  id.people,

  
  lt.listing_types,
  lt.days

  FROM house h
  LEFT JOIN house_info hi 
    USING(house_id)

  LEFT JOIN icon_details id 
    USING (house_id)
  LEFT JOIN listings ls
    USING (house_id)
  LEFT JOIN listing_types lt
    USING (listing_types_id)
    
    WHERE house_id=? AND  active >= NOW()
    `,
      [id]
    );
  } else {
    [results] = await connection.query(
      `
    SELECT 
     house_id,
      h.is_lt,
      id.bed,
      id.bath,
      ar.name AS area,
      ltp.type AS lt_type,
      lh.state,
      lh.address,
      lh.city,
      lh.apt,
      lh.zip,
      lhi.rent AS price,
      lhi.contract_info,
      lhi.description,
      lhi.broker_name
    FROM house h
    LEFT JOIN icon_details id 
     USING(house_id)

    JOIN lt_house  lh
        USING(house_id)
    
    JOIN lt_house_info lhi
      USING(house_id)

    LEFT JOIN listings ls
      USING (house_id)

    LEFT JOIN listing_types lt
      USING (listing_types_id)

    JOIN area ar
        USING(area_id)

    LEFT JOIN lt_types ltp
      USING (lt_types_id)
    
     WHERE house_id=? AND  active >= NOW()
    
    `,
      [id]
    );
  }
  if (results.length === 0) return null;
  const [results2] = await connection.query(
    `SELECT contact FROM contact_info WHERE house_id =?
    `,
    [id]
  );

  const [results3] = await connection.query(
    `SELECT CONCAT(?,picture) AS picture FROM pictures WHERE house_id =?
    `,
    [location, id]
  );

  await connection.query(
    `
    UPDATE house SET views =views+1 WHERE house_id=?
    
    `,
    [id]
  );
  return { ...results[0], contact: results2, pictures: results3 };
}

export default getHouseById;
