import connection from "./dbConnection.js";
import getHostLocation from "../functions/getHostLocation.js";
import { pageSize } from "./getFullHouses.js";

async function getHouseByArea({ location, pageNumber = 0, isLt, isSum }) {
  const finalResults = [];
  let results;
  if (isLt) {
    [results] = await connection.query(
      `
  SELECT 
      h.house_id,
      h.is_lt,
      id.bed,
      id.bath,
      ar.name AS area,
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
  
  
  
      JOIN area ar
      USING(area_id)
  
      WHERE name=? AND  active >= NOW()
       
          
          LIMIT ?,?
          
          
          `,
      [location, pageNumber * pageSize, pageSize + 1],
    );
  } else if (isSum) {
    [results] = await connection.query(
      `
    SELECT 
      
      house_id,  
      is_sum,
      area,
      state,
      id.bed,
      id.bath,
      id.shower,
      id.people,
      id.crib,
      hi.price,
      hi.per,
      sm.bungalow_colony,
      ht.house_type,
      smt.summer_time,
      
      
      ls.active
      
    FROM house
    
    LEFT JOIN icon_details id 
      USING (house_id)
    LEFT JOIN listings ls
      USING (house_id)

    LEFT JOIN house_info hi
      USING(house_id)
    LEFT JOIN summer sm
      USING(house_id)

    LEFT JOIN house_type ht
      USING(house_type_id)

    LEFT JOIN summer_time smt
      USING(summer_time_id)
    
    WHERE active >= NOW() AND area=? AND is_sum IS NOT NULL
    ORDER BY house_id DESC

   LIMIT ?,?
    
    
    `,
      [location, pageNumber * pageSize, pageSize + 1],
    );
  } else {
    [results] = await connection.query(
      `
    SELECT 
      house_id,  
      is_sum,
      area,
      state,
      id.bed,
      id.bath,
      id.shower,
      id.people,
      id.crib,
      
      
      ls.active
      
    FROM house
    
    LEFT JOIN icon_details id 
      USING (house_id)
    JOIN listings ls
      USING (house_id)
    
    WHERE active >= NOW() AND area=? AND is_sum IS NULL
    ORDER BY house_id DESC

   LIMIT ?,?
    
    
    `,
      [location, pageNumber * pageSize, pageSize + 1],
    );
  }
  for (let data of results) {
    const [resultsPictures] = await connection.query(
      `
    SELECT 
      CONCAT (?,picture) AS picture 
    FROM pictures
    WHERE house_id= ?
    
    `,
      [getHostLocation, data.house_id],
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

export default getHouseByArea;
