import express from "express";
import auth from "../middleware/auth.js";
import adminCheck from "../middleware/adminCheck.js";
import getListingsById from "../db/getListingsById.js";
import getHouseByIdUnActive from "../db/getHouseByIdUnActive.js";
import postActiveHouse from "../db/postActiveHouse.js";
import postListingType from "../db/postListingType.js";
import deleteListingType from "../db/deleteListingType.js";
import getAdminAllListings from "../db/getAdminAllListings.js";
import getPc from "../db/getPc.js";
import postPc from "../db/postPc.js";
import deletePc from "../db/deletePc.js";
const router = express.Router();

router.get("/allListings", auth, await adminCheck, async (req, res) => {
  res.status(200).send(await getAdminAllListings());
});

router.get("/allPc", auth, await adminCheck, async (req, res) => {
  res.send(await getPc());
});

router.post("/newListing", auth, await adminCheck, async (req, res) => {
  const { listing_type, house_id } = req.body;
  const listingResults = await getListingsById(house_id);
  // if (listingResults.length > 0) {
  //   await postEditListings(house_id, listing_type);
  // } else {
  //   await postListings(house_id, listing_type);
  // }
  const results = await getHouseByIdUnActive(house_id);

  await postActiveHouse(results, 0);
  res.status(200).json("Successfully Listed");
});

router.post("/newListingType", auth, await adminCheck, async (req, res) => {
  const { listing_types, price, days, isLt } = req.body;
  await postListingType(listing_types, price, days, isLt);
  res.status(200).send("Successfully Added ");
});

router.post("/newPc", auth, await adminCheck, async (req, res) => {
  await postPc(req.body);
  res.status(200).json({ success: true });
});

router.delete("/listingTypce/:id", auth, adminCheck, async (req, res) => {
  await deleteListingType(req.params.id);
  res.status(200).send("Successfully Deleted");
});

router.delete("/Pc/:id", auth, adminCheck, async (req, res) => {
  await deletePc(req.params.id);
  res.status(200).send("Successfully Deleted");
});
export default router;
