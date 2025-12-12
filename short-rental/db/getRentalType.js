import connection from "./dbConnection.js";
import getHostLocation from "../functions/getHostLocation.js";
import { pageSize } from "./getFullHouses.js";

async function getRentalType(rentalType, pageNumber = 0) {
  const finalResults = [];
  const [results] = await connection.query(
    `
    SELECT 
      DISTINCT house_id,  
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
    JOIN rental_type
      USING (house_id)
    JOIN rental_type_selection 
      USING(rental_type_selection_id)
    JOIN listings ls
      USING (house_id)
    
    WHERE active >= NOW() AND rental_type=?
   
   LIMIT ?,?
       
       
       `,
    [rentalType, pageNumber * pageSize, pageSize + 1]
  );

  for (let data of results) {
    const [resultsPictures] = await connection.query(
      `
    SELECT 
      CONCAT (?,picture) AS picture 
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

export default getRentalType;
