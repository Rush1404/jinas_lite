// ─── Order Service ──────────────────────────────────────────────────────────
// Handles checkout: creates an `orders` row, persists `order_items`, and
// returns a confirmation. Two paths:
//
//   - MOCK (default in dev when no Stripe key set):
//       Skips real payment, marks order as 'paid' immediately.
//       Useful so the checkout flow is fully clickable in development.
//
//   - REAL (production with VITE_STRIPE_PUBLISHABLE_KEY):
//       Calls a Supabase Edge Function `create-payment-intent`, which
//       talks to Stripe with the secret key (never exposed to the browser).
//       Front-end confirms the PaymentIntent with @stripe/stripe-js.
//
// The two paths share the same DB writes — only the payment step differs.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase";
import { config } from "../lib/config";
import { cartStore } from "../lib/cartStore";
import { authStore } from "../lib/authStore";
import type { Cart, ShippingAddress, OrderSummary } from "../types/cart";

export interface CheckoutResult {
  orderId: string;
  paymentMethod: "mock" | "stripe";
}

const isSupabaseConfigured = () =>
  Boolean(config.supabase.url) && Boolean(config.supabase.anonKey);

// In-memory order storage when Supabase isn't configured
const mockOrders = new Map<string, any>();

// ─── Place an order ─────────────────────────────────────────────────────────
export async function placeOrder(
  shipping: ShippingAddress
): Promise<CheckoutResult> {
  const cart = cartStore.getCart();
  const summary = cartStore.summary();

  if (cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  if (!isSupabaseConfigured()) {
    // ── Dev fallback ─────────────────────────────────────────────────
    const id = `mock-${Date.now()}`;
    mockOrders.set(id, {
      id,
      shipping,
      cart: { ...cart },
      summary: { ...summary },
      status: "paid",
      created_at: new Date().toISOString(),
    });
    cartStore.clear();
    return { orderId: id, paymentMethod: "mock" };
  }

  // ── 1. Insert the order row ──────────────────────────────────────────
  const userId = authStore.getState().user?.id ?? null;

  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      email: shipping.email,
      status: "pending",
      subtotal_cents: summary.subtotalCents,
      tax_cents: summary.taxCents,
      shipping_cents: summary.shippingCents,
      total_cents: summary.totalCents,
      currency: "USD",
      shipping_name: shipping.name,
      shipping_addr1: shipping.addr1,
      shipping_addr2: shipping.addr2 ?? null,
      shipping_city: shipping.city,
      shipping_region: shipping.region,
      shipping_postal: shipping.postal,
      shipping_country: shipping.country,
      payment_method: config.stripe.isMock ? "mock" : "stripe",
    })
    .select()
    .single();

  if (orderErr || !orderRow) {
    throw new Error(orderErr?.message || "Order creation failed");
  }

  // ── 2. Insert line items ─────────────────────────────────────────────
  const itemRows = cart.items.map((item) => ({
    order_id: orderRow.id,
    product_id: item.productId,
    sku: item.sku,
    name: item.name,
    unit_price_cents: item.unitPriceCents,
    quantity: item.quantity,
    image_path: item.image,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
  if (itemsErr) {
    throw new Error("Failed to save order items: " + itemsErr.message);
  }

  // ── 3. Process payment ───────────────────────────────────────────────
  if (config.stripe.isMock) {
    await markOrderPaid(orderRow.id, `mock_pi_${Date.now()}`);
    cartStore.clear();
    return { orderId: orderRow.id, paymentMethod: "mock" };
  }

  // ── REAL STRIPE PATH ────────────────────────────────────────────────
  // Call the edge function to create a PaymentIntent server-side.
  const { data: piData, error: piError } = await supabase.functions.invoke(
    "create-payment-intent",
    { body: { orderId: orderRow.id, amount: summary.totalCents, currency: "USD" } }
  );

  if (piError || !piData?.clientSecret) {
    throw new Error("Payment setup failed: " + (piError?.message || "no clientSecret"));
  }

  // Lazy-load Stripe.js so it doesn't bloat the bundle for dev users.
  const { loadStripe } = await import("@stripe/stripe-js");
  const stripe = await loadStripe(config.stripe.publishableKey);
  if (!stripe) throw new Error("Stripe failed to load");

  const result = await stripe.confirmCardPayment(piData.clientSecret, {
    payment_method: piData.paymentMethodId, // collected via Stripe Elements
  });

  if (result.error) throw new Error(result.error.message);

  await markOrderPaid(orderRow.id, result.paymentIntent?.id ?? "");
  cartStore.clear();
  return { orderId: orderRow.id, paymentMethod: "stripe" };
}

async function markOrderPaid(orderId: string, paymentIntentId: string) {
  await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}

// ─── Fetch a single order (success page + account orders) ───────────────────
export async function getOrder(orderId: string) {
  if (!isSupabaseConfigured()) {
    return mockOrders.get(orderId) ?? null;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  return { ...order, items: items ?? [] };
}

// ─── Fetch the current user's orders (account page) ─────────────────────────
export async function listMyOrders() {
  const user = authStore.getState().user;
  if (!user) return [];

  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export type { Cart, ShippingAddress, OrderSummary };