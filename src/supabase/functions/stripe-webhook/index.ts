// ============================================================
// Supabase Edge Function: stripe-webhook
//
// Stripe calls this URL after a payment succeeds/fails.
// It verifies the signature and updates the corresponding order.
//
// Deploy:
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   (--no-verify-jwt because Stripe doesn't send a Supabase JWT)
//
// Set secrets:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// In Stripe Dashboard → Developers → Webhooks, add an endpoint:
//   https://<project-ref>.functions.supabase.co/stripe-webhook
// Subscribe to:
//   payment_intent.succeeded
//   payment_intent.payment_failed
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.8.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret,
    );
  } catch (err) {
    return new Response(
      `Webhook signature failed: ${(err as Error).message}`,
      { status: 400 },
    );
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata.order_id;
    if (orderId) {
      await admin
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", orderId);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata.order_id;
    if (orderId) {
      await admin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});