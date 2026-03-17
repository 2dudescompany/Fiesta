// api/cashfree-verify-order.js
// Vercel serverless function — adapted from paymenttest/route(1).js

import { createClient } from '@supabase/supabase-js';

// Use the service role key so this backend function can bypass RLS and write to subscriptions
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { orderId, userId, planId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing required query param: orderId' });
    }

    // Query Cashfree for all payments on this order
    const response = await fetch(
      `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`,
      {
        method: 'GET',
        headers: {
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2022-09-01',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree verify-order error:', data);
      return res.status(502).json({ error: data.message || 'Failed to fetch payment status' });
    }

    // data is an array of payments — check the first one (most recent)
    const payment = Array.isArray(data) ? data[0] : null;
    const paymentStatus = payment?.payment_status; // "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED"

    if (paymentStatus === 'SUCCESS') {
      // Update Supabase subscriptions table
      if (userId && planId) {
        const { error: dbError } = await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              plan_id: planId,
              cashfree_order_id: orderId,
              status: 'active',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' } // one subscription per user — update if exists
          );

        if (dbError) {
          console.error('Supabase upsert error:', dbError);
          // Don't fail the response — payment was still successful
        }
      }

      return res.status(200).json({ status: 'SUCCESS', paymentStatus });
    }

    if (paymentStatus === 'FAILED' || paymentStatus === 'USER_DROPPED') {
      return res.status(200).json({ status: 'FAILED', paymentStatus });
    }

    // PENDING or unknown
    return res.status(200).json({ status: 'PENDING', paymentStatus });
  } catch (error) {
    console.error('cashfree-verify-order handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
