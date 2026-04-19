import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      payment_method_types: ['card'],
      success_url: 'https://med-avisio.vercel.app/?setup=success',
      cancel_url: 'https://med-avisio.vercel.app/?setup=cancel',
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Fehler beim Erstellen der Stripe-Session',
    });
  }
}
