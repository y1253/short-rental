import express from "express";
import postUser from "../db/postUser.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyGoogleToken from "../functions/verifyGoogleToken.js";
import getEmail from "../db/getEmail.js";
import getToken from "../functions/getToken.js";
import createStripeCostumer from "../functions/savePaymentMethod.js";
import sendEmail from "../functions/sendEmail.js";
const router = express.Router();

router.post("/", async (req, res) => {
  if (!req.body) return res.status(400).send("invalid post");
  let user = await getEmail(req.body.email);
  if (user.length > 0) return res.status(400).send("account exists");

  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);
  await postUser(req.body);
  await sendEmail({ name: req.body, email: req.body.email, emailType: 1 });
  const token = await getToken(req.body);

  res.status(200).send(token);
});

router.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).send("Missing Google credential");
  }

  // Verify the Google token
  const payload = await verifyGoogleToken(credential);

  if (!payload) {
    return res.status(400).send("Invalid Google token");
  }

  // Extract user info from Google payload
  const { email, given_name, family_name } = payload;

  // Check if user exists
  let user = await getEmail(email);

  // Create a new user with Google info
  // Generate a random password for Google users

  if (user.length === 0) {
    const randomPassword = Math.random().toString(36).slice(-10);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    const newUser = {
      first_name: given_name,
      last_name: family_name,
      email: email,
      password: hashedPassword,
      auth_type: "google",
    };

    await postUser(newUser);
    await sendEmail({ email, name: given_name, emailType: 1 });
    return res.status(200).send(await getToken(newUser));
  }

  // Get the newly created user
  //user = await getUserByEmail(email);

  // Create a JWT token
  const token = await getToken(user[0]);

  res.status(200).send(token);
});

export default router;
