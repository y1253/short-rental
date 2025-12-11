import express from "express";
import getPromoCodeByPc from "../db/getPromoCodeByPc.js";
const router = express.Router();

router.post("/", async (req, res) => {
  const { promo_code } = req.body;
  const results = await getPromoCodeByPc(promo_code);
  if (!results) return res.status(404).json({ error: "Promo Code Not Found " });
  res.status(200).json({
    promo_code: results.promo_code_id,
    amount: results.amount,
    message: results.message,
  });
});
export default router;
