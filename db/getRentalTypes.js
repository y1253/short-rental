import connection from "./dbConnection.js";

async function getRentalTypes() {
  const [results] = await connection.query(
    `
    SELECT     
     *
    FROM rental_type_selection
    
    
    
    `
  );

  return results;
}

export default getRentalTypes;
