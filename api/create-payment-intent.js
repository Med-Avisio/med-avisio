// Vercel Serverless Function
// Creates and confirms a PaymentIntent later using a saved payment method.

const Stripe = require("stripe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }

    const stripe = new Stripe(stripeSecretKey);

    const { customerId, paymentMethodId, amountCents, description } = req.body || {};

    if (!customerId || !paymentMethodId || !amountCents) {
      return res.status(400).json({
        error: "customerId, paymentMethodId and amountCents are required",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: description || "med-avisio Beratung",
      metadata: {
        source: "med-avisio-charge",
      },
    });

    return res.status(200).json({
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error("create-payment-intent error:", error);

    // Stripe may require customer authentication in some edge cases.
    return res.status(500).json({
      error: "Failed to create PaymentIntent",
      details: error.message,
      code: error.code || null,
    });
  }
};
