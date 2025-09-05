import Stripe from "stripe";
const stripe = new Stripe(process.env.KEY_FOR_TEST);

async function savePaymentMethod({ email, paymentMethodId }) {
  try {
    // Check if customer already exists
    const customers = await stripe.customers.list({ email });

    let customer;
    if (customers.data.length > 0) {
      // Use existing customer
      customer = customers.data[0];
      console.log("Using existing customer:", customer.id);
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email,
      });
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set as default payment method (optional)
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  } catch (error) {
    console.error("Customer creation error:", error);
  }
}

export default savePaymentMethod;
