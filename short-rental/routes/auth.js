import express from "express";
import getEmail from "../db/getEmail.js";
import bcrypt from "bcryptjs";
import getToken from "../functions/getToken.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  let user = await getEmail(email);
  if (user.length === 0)
    return res.status(400).send("Invalid Email Or Password");

  if (!(await bcrypt.compare(password, user[0].password)))
    return res.status(400).send("Invalid Email Or Password");

  res.status(200).send(await getToken(user[0]));
});

export default router;
