import express from "express";
import getFullHouses from "../db/getFullHouses.js";
import authMiddleware from "../middleware/auth.js";
import postHouse from "../db/postHouse.js";
import getHouseByArea from "../db/getHouseByArea.js";
import getLocations from "../db/getLocations.js";
import getRentalType from "../db/getRentalType.js";
import getHouseByTypeLocation from "../db/getHouseByTypeLocation.js";
import postListings from "../db/postListings.js";
import getHouseByAccount from "../db/getHouseByAccount.js";
import getRentalTypes from "../db/getRentalTypes.js";
import getListings from "../db/getListings.js";
import getPath from "../functions/getPath.js";
import getHouseById from "../db/getHouseById.js";
import getHouseByIdUnActive from "../db/getHouseByIdUnActive.js";
import admin from "./admin.js";
import auth from "./auth.js";
import users from "./users.js";
import session from "express-session";
import viesMiddleware from "../middleware/viesMiddleware.js";
import postEditHouseById from "../db/postEditHouseById.js";

const router = express.Router();
router.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 },
  })
);

router.use(viesMiddleware);
router.use("/admin", admin);
router.use("/users", users);
router.use("/auth", auth);

router.get("/", async (req, res) => {
  if (req.query.id) return res.send(await getHouseById(req.query.id));
  if (req.query.newid)
    return res.send(await getHouseByIdUnActive(req.query.newid));
  if (req.query.rentaltype && req.query.location)
    return res.send(
      await getHouseByTypeLocation(req.query.rentaltype, req.query.location)
    );
  if (req.query.rentaltype)
    return res.send(
      await getRentalType(req.query.rentaltype, req.query.pageNumber)
    );
  if (req.query.location)
    return res.send(
      await getHouseByArea(req.query.location, req.query.pageNumber)
    );

  res.send(await getFullHouses(req.query.pageNumber));
});

router.get("/account_listings", authMiddleware, async (req, res) => {
  res.status(200).send(await getHouseByAccount(req.account_id));
});
router.get("/locations", async (req, res) => {
  res.status(200).send(await getLocations());
});

router.get("/listings", async (req, res) => {
  res.status(200).send(await getListings());
});

router.get("/rentaltypes", async (req, res) => {
  res.status(200).send(await getRentalTypes());
});

router.get("/account", authMiddleware, async (req, res) => {
  res.status(200).send(await getHouseByAccount(req.account_id));
  console.log(req.account_id);
});

router.post("/", authMiddleware, async (req, res) => {
  const house = JSON.parse(req.body.info);

  const results = getPath(req, req.account_id);

  const id = await postHouse({
    ...house,
    account_id: req.account_id,
    // contact_info: req.body.contact,
    pictures: results,
  });

  res.status(200).send({ house_id: id });
});

router.post("/listings", authMiddleware, async (req, res) => {
  const id = await postListings(req.body);

  res.status(200).send("Successful");
});

router.put("/", authMiddleware, async (req, res) => {
  const house = JSON.parse(req.body.info);

  const results = getPath(req, req.account_id);

  await postEditHouseById({
    ...house,
    pictures: results,
  });

  res.send("edit successfully ");
});

router.delete("/:id", authMiddleware, async (req, res) => {
  await deleteHouseById(req.params.id);
  res.status(200).send("Delete Successful");
});

export default router;
