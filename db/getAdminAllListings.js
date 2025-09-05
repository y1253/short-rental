import getHostLocation from "../functions/getHostLocation.js";
import connection from "./dbConnection.js";

async function getAdminAllListings() {
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
    LEFT JOIN listings ls
      USING (house_id)
      
    
    
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
