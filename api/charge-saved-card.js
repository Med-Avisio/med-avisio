import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, amount } = req.body || {};

    if (!customerId || !amount) {
      return res.status(400).json({ error: 'customerId oder amount fehlt' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    if (!paymentMethods.data.length) {
      return res.status(400).json({ error: 'Keine gespeicherte Karte gefunden' });
    }

    const paymentMethod = paymentMethods.data[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      customer: customerId,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
    });

    return res.status(200).json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Fehler beim Abbuchen',
    });
  }
}
