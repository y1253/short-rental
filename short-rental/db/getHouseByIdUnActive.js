import connection from "./dbConnection.js";
import location from "../functions/getHostLocation.js";
import getIsLt from "./getIsLt.js";

async function getHouseByIdUnActive(id) {
  let results = [];
  if (!await getIsLt(id)) {
    
    
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
      
      WHERE house_id=? 
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
      ar.area_id,
      ar.name AS area,
      lh.state,
      lh.address,
      lh.city,
      lh.apt,
      lh.zip,
      lhi.rent AS price,
      lhi.contract_info,
      lhi.description,
      lhi.broker_name,
    
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
    
    
    JOIN lt_house lh
      USING (house_id)

    JOIN area ar
      USING(area_id)
    

    JOIN lt_house_info lhi
      USING (house_id)
      
      WHERE house_id=? 
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

  const [results4] = await connection.query(
    `SELECT rental_type_selection_id AS rental_type FROM rental_type WHERE house_id =?
    `,
    [id]
  );

  const [results3] = await connection.query(
    `SELECT CONCAT(?,picture) AS picture FROM pictures WHERE house_id =?
    `,
    [location, id]
  );

  return {
    ...results[0],
    contact: results2,
    pictures: results3,
    rental_type: results4,
  };
}

export default getHouseByIdUnActive;
