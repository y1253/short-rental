import express from "express";
import "dotenv/config";
import Stripe from "stripe";
import path from "path";
import { fileURLToPath } from "url";
import savePaymentMethod from "../functions/savePaymentMethod.js";
import postActiveHouse from "../db/postActiveHouse.js";
import getHouseByIdUnActive from "../db/getHouseByIdUnActive.js";
import postListings from "../db/postListings.js";
import getListingsById from "../db/getListingsById.js";
import postEditListings from "../db/postEditListings.js";
import auth from "../middleware/auth.js";
import sendEmail from "../functions/sendEmail.js";
import getEmail from "../db/getEmail.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize Stripe
const stripe = new Stripe(
  process.env.STRIPE_KEY
);

//Fake CC  4242 4242 4242 4242

// 1. Create or retrieve a customer

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "payment.html"));
});
router.post("/process-payment", auth, async (req, res) => {
  const { paymentMethodId, amount, house_id, listing_type } = req.body;
  console.log(paymentMethodId, amount, house_id, listing_type);

  const listingResults = await getListingsById(house_id);

  if (listingResults.length > 0) {
    await postEditListings(house_id, listing_type);
  } else {
    await postListings(house_id, listing_type);
  }

  try {
    // Create a payment intent with the payment method ID from the frontend
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      description: "Product purchase",
      metadata: { orderId: "order_" + Date.now() },
      return_url: "https://your-website.com/payment-success",
    });

    // Handle the payment result
    if (
      paymentIntent.status === "succeeded" ||
      paymentIntent.status === "processing"
    ) {
      const results = await getHouseByIdUnActive(house_id);

      const transactionId = await postActiveHouse(results, amount);
      const userResults = await getEmail(req.email);
      await sendEmail({
        name: userResults[0].first_name,
        emailType: 2,
        amount: amount / 100,
        email: req.email,
        transactionId,
      });

      return res.json({ success: true, paymentIntent });
    } else if (paymentIntent.status === "requires_action") {
      // 3D Secure authentication needed
      return res.json({
        success: false,
        requires3dSecure: true,
        clientSecret: paymentIntent.client_secret,
      });
    } else {
      return res.json({
        success: false,
        error: "Payment failed",
      });
    }
  } catch (error) {
    console.error("Payment error:", error);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/save-payment-method", auth, async (req, res) => {
  await savePaymentMethod({ ...req.body, email: req.email });
  res.send("good");
});

// 3. Get saved payment methods for a customer
router.get("/payment-methods", auth, async (req, res) => {
  const customers = await stripe.customers.list({ email: req.email });
  if (!customers.data[0] > 0) return res.status(404).send("costumer not found");

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customers.data[0].id,
      type: "card",
    });

    res.send({
      success: true,
      paymentMethods: paymentMethods.data,
      customerId: customers.data[0].id,
    });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// 4. Charge a saved payment method
router.post("/api/charge-saved-card", async (req, res) => {
  const { customerId, paymentMethodId, amount, house_id } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true, // Important for using saved cards!
      confirm: true,
    });
    const results = await getHouseByIdUnActive(house_id);
    await postActiveHouse(results, amount);
    const transactionId = await postActiveHouse(results, amount);
    const userResults = await getEmail(req.email);
    await sendEmail({
      name: userResults[0].first_name,
      emailType: 2,
      amount: amount / 100,
      email: req.email,
      transactionId,
    });

    res.json({ success: true, paymentIntent });
  } catch (error) {
    console.error("Charge saved card error:", error);

    // Special handling for authentication required errors
    if (error.code === "authentication_required") {
      res.status(400).json({
        success: false,
        error: "This card requires authentication for this purchase.",
        paymentIntentId: error.raw.payment_intent.id,
      });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
});

// 5. Delete a saved payment method
router.delete("/api/payment-methods/:paymentMethodId", async (req, res) => {
  const { paymentMethodId } = req.params;

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    res.send({ success: true });
  } catch (error) {
    console.error("Delete payment method error:", error);
    res.status(400).send({ success: false, error: error.message });
  }
});

router.get("/adminAdd/:house_id/:listing_type", async (req, res) => {
  await postListings(req.params.house_id, req.params.listing_type);
  const results = await getHouseByIdUnActive(req.params.house_id);

  await postActiveHouse(results, 0);
  res.send("Insert Successfully");
});

export default router;
