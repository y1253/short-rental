import connection from "./dbConnection.js";

async function deleteHouseById(id) {
  await connection.query(
    `
    UPDATE listings 
    SET delete_at = NOW(),active=null
    WHERE house_id=?
    `,
    [id]
  );
}

export default deleteHouseById;
