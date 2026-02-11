import connection from "./dbSmsConnection.js";

async function postSms(number,message) {
  connection.query(
    `
    INSERT INTO 
    sms
    VALUES (default,?,?,NOW())
    `,[number,message]
  );
}

export default postSms;
