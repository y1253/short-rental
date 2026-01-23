import getHostLocation from "../functions/getHostLocation.js";
import connection from "./dbConnection.js";
export const pageSize = 8;
async function getFullHouses({ pageNumber = 0, isLt }) {
  //if (isLt) return await getLtFullHouses();
  //DATE_SUB(active, INTERVAL days DAY) AS date_minus_30
  const finalResults = [];
  let results = [];

  if (!isLt) {
    [results] = await connection.query(
      `
    SELECT 
      DISTINCT house_id,  
      area,
      state,
      id.bed,
      id.bath,
      id.crib,
      id.people,
      id.shower
      
      
    FROM house h
    LEFT JOIN icon_details id 
     USING(house_id)
    
    JOIN listings ls
      USING (house_id)

    
    
    WHERE active >= NOW() AND h.is_lt IS NULL
    order by h.house_id desc
   
    
    LIMIT ?,?
    
    
    
    `,
      [pageNumber * pageSize, pageSize + 1]
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
      lhi.rent AS price 

     
      
      
    FROM house h
    LEFT JOIN icon_details id 
     USING(house_id)

    JOIN lt_house  lh
        USING(house_id)
    LEFT JOIN lt_house_info lhi
      USING(house_id)
    
    LEFT JOIN listings ls
      USING (house_id)

    
     JOIN area ar
        USING(area_id)

    LEFT JOIN lt_types ltp
      USING (lt_types_id)
    
    WHERE active >= NOW() AND h.is_lt IS NOT NULL
    order by h.house_id desc
    
    
    LIMIT ?,?
    
    
    
    `,
      [pageNumber * pageSize, pageSize + 1]
    );
  }

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

export default getFullHouses;
