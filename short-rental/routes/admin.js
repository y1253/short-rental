import express from "express";
import auth from "../middleware/auth.js";
import adminCheck from "../middleware/adminCheck.js";
import getListingsById from "../db/getListingsById.js";
import postEditListings from "../db/postEditListings.js";
import postListings from "../db/postListings.js";
import getHouseByIdUnActive from "../db/getHouseByIdUnActive.js";
import postActiveHouse from "../db/postActiveHouse.js";
import postListingType from "../db/postListingType.js";
import deleteListingType from "../db/deleteListingType.js";
import getAdminAllListings from "../db/getAdminAllListings.js";
const router = express.Router();

router.get('/allListings',auth,await adminCheck,async(req,res)=>{
  res.status(200).send(await getAdminAllListings())
})

router.post("/newListing", auth, await adminCheck, async (req, res) => {
  const { listing_type, house_id } = req.body;
  const listingResults = await getListingsById(house_id);
  if (listingResults.length > 0) {
    await postEditListings(house_id, listing_type);
  } else {
    await postListings(house_id, listing_type);
  }
  const results = await getHouseByIdUnActive(house_id);

  await postActiveHouse(results, 0);
  res.status(200).json("Successfully Listed");
});

router.post("/newListingType", auth, await adminCheck, async (req, res) => {
  const { listing_types, price, days,isLt } = req.body;
  await postListingType(listing_types, price, days,isLt);
  res.status(200).send("Successfully Added ");
});

router.delete("/listingType/:id", auth, adminCheck, async (req, res) => {
  await deleteListingType(req.params.id);
  res.status(200).send("Successfully Deleted");
});

export default router;
