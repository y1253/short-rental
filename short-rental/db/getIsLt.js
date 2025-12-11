import connection from "./dbConnection.js";

async function getIsLt(id) {
  const [results] = await connection.query(
    `SELECT * FROM house
    WHERE house_id=?
    `,
    [id]
  );
  // if (results.length === 0) return false;

  return results[0].is_lt ? true : false;
}

export default getIsLt;
