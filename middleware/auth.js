import jwt from "jsonwebtoken";

function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Login first");

  try {
    const { email, account_id } = jwt.verify(token, "code");
    req.email = email;
    req.account_id = account_id;
    next();
  } catch (e) {
    res.status(400).send("Invalid token");
  }
}

export default auth;
