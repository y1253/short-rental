import connection from "./dbConnection.js";
import location from "../functions/getHostLocation.js";

async function getHouseByIdUnActive(id) {
  const [results] = await connection.query(
    `
   SELECT 
  house_id,
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

  FROM house 
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

  return { ...results[0], contact: results2, pictures: results3 };
}

export default getHouseByIdUnActive;
