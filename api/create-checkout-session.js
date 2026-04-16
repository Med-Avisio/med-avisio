import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Online-Sprechstunde trockene Augen',
            },
            unit_amount: 6000, // 60€ in Cent
          },
          quantity: 1,
        },
      ],
      success_url: 'https://DEINE-DOMAIN.vercel.app/success',
      cancel_url: 'https://DEINE-DOMAIN.vercel.app/cancel',
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
