import getHostLocation from "../functions/getHostLocation.js";
import connection from "./dbConnection.js";

async function getAdminAllListings() {
  const finalResults = [];
  const [results] = await connection.query(
    `
    SELECT 
      DISTINCT house_id,  
      IF(h.is_lt>=1,ar.name,area) AS area,
      
      IF(h.is_lt>=1,lh.state,h.state) AS state,
      id.bed,
      id.bath,
      id.shower,
      id.people,
      id.crib,
      
      
      ls.active
    FROM house h
    
    LEFT JOIN icon_details id 
      USING (house_id)
    LEFT JOIN listings ls
      USING (house_id)
    LEFT JOIN lt_house lh
      USING(house_id)
    LEFT JOIN area ar
      USING(area_id)
      
    
    
    `
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

  return finalResults;
}

export default getAdminAllListings;
