import connection from "./dbConnection.js";
import getHostLocation from "../functions/getHostLocation.js";
import { pageSize } from "./getFullHouses.js";

async function getRentalType(rentalType, pageNumber = 0, isSum) {
  const finalResults = [];
  let results = [];

  if (isSum) {
    [results] = await connection.query(
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
      hi.price,
      hi.per,
      sm.bungalow_colony,
      ht.house_type,
      smt.summer_time,
      
      
      ls.active
      
    FROM house
    
    LEFT JOIN icon_details id 
      USING (house_id)
    LEFT JOIN rental_type
      USING (house_id)
   LEFT JOIN house_info hi 
      USING(house_id)
    JOIN listings ls
      USING (house_id)
    LEFT JOIN summer sm
      USING(house_id)
    LEFT JOIN house_type ht
      USING(house_type_id)
    LEFT JOIN summer_time smt
      USING(summer_time_id)
    WHERE active >= NOW() AND summer_time=?
   
   LIMIT ?,?
       
       
       `,
      [rentalType, pageNumber * pageSize, pageSize + 1],
    );
  } else {
    [results] = await connection.query(
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
      [rentalType, pageNumber * pageSize, pageSize + 1],
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

export default getRentalType;
