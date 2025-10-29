import connection from "./dbConnection.js";
import getHostLocation from "../functions/getHostLocation.js";

const pageSize = 8;
async function getHouseByLocationId({ locationId, pageNumber = 0 }) {
  const finalResults = [];
  const [results] = await connection.query(
    `
SELECT 
    house_id,
    h.is_lt,
    id.bed,
    id.bath,
    ar.name,
    lh.state,
    lh.address,
    lh.city,
    lh.apt,
    lh.zip,
    lhi.rent,
    lhi.contract_info,
    lhi.description,
    lhi.broker_name,
    DATE_SUB(active, INTERVAL days DAY) AS date_minus_30
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

    WHERE area_id=?
     ORDER BY date_minus_30 DESC
        
        LIMIT ?,?
        
        
        `,
    [locationId, pageNumber * pageSize, pageSize + 1]
  );

  for (let data of results) {
    const [resultsPictures] = await connection.query(
      `
    SELECT 
      CONCAT(?,picture) AS picture
      
    FROM pictures
   
    WHERE house_id= ?
    
    `,
      [getHostLocation, data.house_id]
    );
    finalResults.push({ ...data, pictures: resultsPictures });
  }
  const hasMore = finalResults.length > pageSize;
  const data = hasMore ? finalResults.slice(0, pageSize) : finalResults;
  return {
    data,
    hasMore,
  };
}

export default getHouseByLocationId;
