import connection from "./dbConnection.js";

async function getLocations(isLt) {
  let results=[];
  if(isLt){
     [results] = await connection.query(
      `
      SELECT     
      area_id,
      name AS area
      FROM area
      
      
      
      `
    );
  }
  else{
   [results] = await connection.query(
    `
    SELECT     
      DISTINCT area
    FROM house
    JOIN listings ls
      USING (house_id)
    WHERE active >= NOW()
    
    `
  );
  }
  return results;
}

export default getLocations;
