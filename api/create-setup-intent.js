// Vercel Serverless Function
// Creates a Stripe Customer + SetupIntent so the patient can save a card
// without being charged now.

const Stripe = require("stripe");

module.exports = async (req, res) => {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }

    const stripe = new Stripe(stripeSecretKey);

    const { name, email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Create a Stripe customer for later off-session charging.
    const customer = await stripe.customers.create({
      name: name || undefined,
      email,
      metadata: {
        source: "med-avisio-setup",
      },
    });

    // SetupIntent stores the payment method now, with no charge now.
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        source: "med-avisio-setup",
      },
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    console.error("create-setup-intent error:", error);
    return res.status(500).json({
      error: "Failed to create SetupIntent",
      details: error.message,
    });
  }
};
