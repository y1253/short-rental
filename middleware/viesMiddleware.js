import postViews from "../db/postViews.js";

export default function (req, res, next) {
  if (!req.session.views) {
    postViews();

    req.session.views = true;
  }

  next();
}
