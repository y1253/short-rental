import connection from "./dbConnection.js";

async function getLtTypes() {
  const [results] = await connection.query(
    `
    SELECT     
     lt_types_id,
     type
    FROM lt_types
    WHERE delete_at is NULL
    
    
    
    `
  );

  return results;
}

export default getLtTypes;
