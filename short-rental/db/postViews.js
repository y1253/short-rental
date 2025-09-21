import connection from "./dbConnection.js";

function postViews() {
  connection.query(
    `
    INSERT INTO 
    web_views
    VALUES (default,NOW())
    `
  );
}

export default postViews;
