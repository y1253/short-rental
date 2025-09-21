import jwt from "jsonwebtoken";
import getEmail from "../db/getEmail.js";

async function getToken(user) {
  const [{ account_id }] = await getEmail(user.email);
  return jwt.sign({ ...user, account_id }, "code");
}
export default getToken;
