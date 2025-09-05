import connection from "./dbConnection.js";

async function getHouseByTypeLocation(type, location) {
  const finalResults = [];
  const [results] = await connection.query(
    `
     SELECT 
      DISTINCT house_id,  
      area,
      state,
      text,  
      price
    FROM house
    JOIN rental_type
      USING (house_id)
    JOIN rental_type_selection 
      USING(rental_type_selection_id)
    JOIN listings ls
      USING (house_id)
    WHERE active >= NOW() AND rental_type=? AND area=?
    
    `,
    [type, location]
  );

  for (let data of results) {
    const [resultsContacts] = await connection.query(
      `
    SELECT 
      contact
      
    FROM contact_info
   
    WHERE house_id= ?
    
    `,
      [data.house_id]
    );
    finalResults.push({ ...data, contact: resultsContacts });
  }

  return finalResults;
}

export default getHouseByTypeLocation;
