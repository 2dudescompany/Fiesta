// api/cashfree-create-order.js
// Vercel serverless function — adapted from paymenttest/route1(1).js

export default async function handler(req, res) {
  // Allow CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  console.log("arrebhai")
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { console.error('Failed to parse body', e); }
    }
    const { planId, amount, userId, userEmail } = body || {};

    if (!planId || !amount || !userId) {
      console.error('Missing fields. Parsed body:', body);
      return res.status(400).json({ error: 'Missing required fields: planId, amount, userId' });
    }

    const orderId = `order_${Date.now()}_${userId.slice(0, 8)}`;

    const response = await fetch('https://sandbox.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_CLIENT_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2022-09-01',
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: 'INR',
        order_note: `Subscription: ${planId} plan`,
        customer_details: {
          customer_id: `cust_${userId.slice(0, 16)}`,
          customer_email: userEmail || 'user@example.com',
          customer_phone: '9999999999', // phone is required by Cashfree; user can update later
        },
        order_meta: {
          return_url: `{return_url}?order_id={order_id}`, // Cashfree fills this in
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree create-order error:', data);
      return res.status(502).json({ error: data.message || 'Failed to create order at Cashfree' });
    }

    return res.status(200).json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
    });
  } catch (error) {
    console.error('cashfree-create-order handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
