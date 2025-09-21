import getHostLocation from "../functions/getHostLocation.js";
import connection from "./dbConnection.js";
export const pageSize = 8;
async function getFullHouses(pageNumber = 0) {
  
  const finalResults = [];
  const [results] = await connection.query(
    `
    SELECT 
      DISTINCT house_id,  
      area,
      state,
      id.bed,
      id.bath,
      id.crib,
      id.people,
      id.shower,
      DATE_SUB(active, INTERVAL days DAY) AS date_minus_30
      
    FROM house
    LEFT JOIN icon_details id 
     USING(house_id)
    
    JOIN listings ls
      USING (house_id)

    JOIN listing_types lt
      USING (listing_types_id)
    
    WHERE active >= NOW()
    ORDER BY date_minus_30 DESC
    
    LIMIT ?,?
    
    
    `,
    [pageNumber * pageSize, pageSize + 1]
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

export default getFullHouses;
