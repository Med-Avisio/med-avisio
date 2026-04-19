import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id fehlt' });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    return res.status(200).json({
      status: session.status,
      customerId: session.customer,
      setupIntentId: session.setup_intent,
      paymentStatus: session.payment_status,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Fehler beim Abrufen der Session',
    });
  }
}
