import connection from "./dbSmsConnection.js";

async function getUniqeSms() {
    const [results] = await connection.query(
    `
    SELECT count( distinct phone) FROM sms
    `
  );
  return results;
}

export default getUniqeSms;
