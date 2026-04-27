// ============================================================
// Supabase Edge Function: create-payment-intent
//
// Called by src/services/orderService.ts during checkout when
// VITE_STRIPE_PUBLISHABLE_KEY is set (production / staging).
//
// Flow:
//   1. Browser places an order (status: pending) in the `orders` table.
//   2. Browser calls this function with { orderId }.
//   3. Function looks up the order, verifies the caller owns it
//      (or it's a guest order matching the session), creates a
//      Stripe PaymentIntent, stores intent id on the order, and
//      returns { clientSecret } to the browser.
//   4. Browser uses Stripe.js to confirm the card payment.
//   5. Stripe webhook (separate function) marks order as paid.
//
// Deploy:
//   supabase functions deploy create-payment-intent
//
// Set secrets:
//   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.8.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return json({ error: "orderId required" }, 400);
    }

    // Service-role client so we can read the order regardless of RLS.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error } = await admin
      .from("orders")
      .select("id, user_id, total_cents, currency, status, customer_email")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return json({ error: "Order not found" }, 404);
    }

    if (order.status !== "pending") {
      return json({ error: `Order is already ${order.status}` }, 400);
    }

    // If the order has a user_id, verify the caller's JWT matches.
    if (order.user_id) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (!user || user.id !== order.user_id) {
        return json({ error: "Not authorized for this order" }, 403);
      }
    }
    // Guest orders (user_id = null) are allowed without auth — the
    // order id itself acts as the bearer secret. If you want to
    // tighten this, require a matching email/session token.

    const intent = await stripe.paymentIntents.create({
      amount: order.total_cents,
      currency: (order.currency ?? "usd").toLowerCase(),
      receipt_email: order.customer_email ?? undefined,
      metadata: { order_id: order.id },
      automatic_payment_methods: { enabled: true },
    });

    await admin
      .from("orders")
      .update({ stripe_payment_intent_id: intent.id })
      .eq("id", order.id);

    return json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error("create-payment-intent error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}