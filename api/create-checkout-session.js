import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'E-Mail fehlt' });
    }

    const customer = await stripe.customers.create({
      email,
      name: name || '',
      metadata: {
        source: 'med-avisio',
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      payment_method_types: ['card'],
      success_url:
        'https://med-avisio.vercel.app/?setup=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://med-avisio.vercel.app/?setup=cancel',
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      customerId: customer.id,
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Fehler beim Erstellen der Stripe-Session',
    });
  }
}
