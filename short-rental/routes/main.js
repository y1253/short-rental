import express from "express";
import getAllLocations from "../db/getAllLocations.js";
import getFullHouses from "../db/getFullHouses.js";
import authMiddleware from "../middleware/auth.js";
import postHouse from "../db/postHouse.js";
import getHouseByArea from "../db/getHouseByArea.js";
import getLocations from "../db/getLocations.js";
import getRentalType from "../db/getRentalType.js";
import getHouseByTypeLocation from "../db/getHouseByTypeLocation.js";
import getHouseByAccount from "../db/getHouseByAccount.js";
import getRentalTypes from "../db/getRentalTypes.js";
import getListings from "../db/getListings.js";
import getPath from "../functions/getPath.js";
import getHouseById from "../db/getHouseById.js";
import getHouseByIdUnActive from "../db/getHouseByIdUnActive.js";
import postEditHouseById from "../db/postEditHouseById.js";
import admin from "./admin.js";
import auth from "./auth.js";
import users from "./users.js";
import promoCode from "./promoCode.js";
import session from "express-session";
import viesMiddleware from "../middleware/viesMiddleware.js";
import deleteHouseById from "../db/deleteHouseById.js";
import getSelectLocations from "../db/getSelectLocations.js";
import getHouseByLocationId from "../db/getHouseByLocationId.js";
import getLtTypes from "../db/getLtTypes.js";
import getHouseType from "../db/getHouseType.js";
import getSummerTime from "../db/getSummerTime.js";

const router = express.Router();
router.use(
  session({
    secret: "keyboardcat",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000, secure: true, sameSite: "lax" },
  }),
);

router.use(viesMiddleware);
router.use("/admin", admin);
router.use("/users", users);
router.use("/auth", auth);
router.use("/promo_code", promoCode);

router.get("/", async (req, res) => {
  if (req.query.id) return res.send(await getHouseById(req.query.id));
  if (req.query.newid)
    return res.send(await getHouseByIdUnActive(req.query.newid));
  if (req.query.rentaltype && req.query.location)
    return res.send(
      await getHouseByTypeLocation(req.query.rentaltype, req.query.location),
    );
  if (req.query.rentaltype)
    return res.send(
      await getRentalType(
        req.query.rentaltype,
        req.query.pageNumber,
        req.query.isSum,
      ),
    );
  if (req.query.location) return res.send(await getHouseByArea(req.query));
  if (req.query.locationId)
    return res.send(await getHouseByLocationId(req.query));

  res.send(await getFullHouses(req.query));
});

router.get("/account_listings", authMiddleware, async (req, res) => {
  res.status(200).send(await getHouseByAccount(req.account_id));
});
router.get("/alllocations", async (req, res) => {
  res.status(200).send([
    ...(await getAllLocations()),
    {
      area: "Williamsburg",
    },
  ]);
});
router.get("/locations", async (req, res) => {
  res.status(200).send(await getLocations(req.query.isLt));
});

router.get("/selectLocations", async (req, res) => {
  res.send(await getSelectLocations());
});

router.get("/listings", async (req, res) => {
  res.status(200).send(await getListings());
});

router.get("/rentaltypes", async (req, res) => {
  res.status(200).send(await getRentalTypes());
});

router.get("/ltTypes", async (req, res) => {
  res.status(200).send(await getLtTypes());
});

router.get("/account", authMiddleware, async (req, res) => {
  res.status(200).send(await getHouseByAccount(req.account_id));
  console.log(req.account_id);
});

router.get("/house_type", async (req, res) => {
  res.send(await getHouseType());
});

router.get("/summer_time", async (req, res) => {
  res.send(await getSummerTime());
});

router.get("/per", (req, res) => {
  res.send(["Night", "Weekend"]);
});

router.post("/", authMiddleware, async (req, res) => {
  const house = JSON.parse(req.body.info);

  const results = getPath(req, req.account_id);

  const id = await postHouse({
    ...house,
    account_id: req.account_id,
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
