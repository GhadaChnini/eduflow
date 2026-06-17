import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';
import Stripe from 'stripe';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, redirectURL } = await request.json();
  const userId = session.user.id;

  // Get course details
  const courseRows = await sql`SELECT * FROM courses WHERE id = ${courseId}`;
  if (courseRows.length === 0) {
    return Response.json({ error: 'Course not found' }, { status: 404 });
  }
  const course = courseRows[0];

  if (course.price === '0.00') {
    return Response.json({ error: 'Course is free' }, { status: 400 });
  }

  // Get or create stripe customer
  const userRows = await sql`SELECT stripe_id FROM "user" WHERE id = ${userId}`;
  let stripeCustomerId = userRows[0]?.stripe_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: session.user.email });
    stripeCustomerId = customer.id;
    await sql`UPDATE "user" SET stripe_id = ${stripeCustomerId} WHERE id = ${userId}`;
  }

  const stripeSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: course.title },
          unit_amount: Math.round(parseFloat(course.price) * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${redirectURL}?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}`,
    cancel_url: redirectURL,
    metadata: {
      userId,
      courseId,
    },
  });

  return Response.json({ url: stripeSession.url });
}
