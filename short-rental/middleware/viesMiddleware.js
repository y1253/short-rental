import postViews from "../db/postViews.js";

export default function (req, res, next) {
  if (!req.session.views) {
    postViews();
    console.log('a')

    req.session.views = 1;
  }
  console.log('b')
  next();
}
