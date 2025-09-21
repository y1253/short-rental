import getAdmin from "../db/getAdmin.js";

export default async function (req, res, next) {
  const results = await getAdmin(req.account_id);

  if (results.length < 1) return res.status(401).send("You Have No Permission");

  next();
}
