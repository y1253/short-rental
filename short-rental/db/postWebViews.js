import connection from "./dbConnection.js";

async function postWebViews() {
  await connection.query(
    `
    INSERT INTO web_views VALUES (default,now())
    `
  );
  
  const [results]=await connection.query(
    `
    SELECT count(view) FROM web_views
    `
  );
  return results;
}

export default postWebViews ;


