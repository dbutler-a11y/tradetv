import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/subscription/webhook
 * Handle PayPal webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`PayPal webhook received: ${eventType}`);

    switch (eventType) {
      case "BILLING.SUBSCRIPTION.CREATED":
        // Subscription created but not yet active
        console.log("Subscription created:", resource.id);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        // Subscription is now active
        await handleSubscriptionActivated(resource);
        break;

      case "BILLING.SUBSCRIPTION.UPDATED":
        // Subscription was updated
        console.log("Subscription updated:", resource.id);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        // Subscription was cancelled
        await handleSubscriptionCancelled(resource);
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        // Subscription was suspended (e.g., payment failed)
        await handleSubscriptionSuspended(resource);
        break;

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        // Payment failed
        console.log("Payment failed for subscription:", resource.id);
        break;

      case "PAYMENT.SALE.COMPLETED":
        // Subscription payment completed
        await handlePaymentCompleted(resource);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(resource: any) {
  const subscriptionId = resource.id;
  const planId = resource.plan_id;
  const subscriberEmail = resource.subscriber?.email_address;

  console.log(`Subscription activated: ${subscriptionId} for ${subscriberEmail}`);

  // Map plan ID to tier
  const tierMap: Record<string, string> = {
    [process.env.PAYPAL_PLAN_STARTER || ""]: "STARTER",
    [process.env.PAYPAL_PLAN_PRO || ""]: "PRO",
    [process.env.PAYPAL_PLAN_ELITE || ""]: "ELITE",
  };

  const tier = tierMap[planId] || "STARTER";

  // Update user's subscription in database
  try {
    const user = await prisma.user.findFirst({
      where: { email: subscriberEmail },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: tier as any,
          paypalSubscriptionId: subscriptionId,
        },
      });
      console.log(`Updated user ${user.id} to ${tier} tier`);
    }
  } catch (dbError) {
    console.error("Database update error:", dbError);
  }
}

async function handleSubscriptionCancelled(resource: any) {
  const subscriptionId = resource.id;

  console.log(`Subscription cancelled: ${subscriptionId}`);

  try {
    // Find user and downgrade to free tier
    const user = await prisma.user.findFirst({
      where: { paypalSubscriptionId: subscriptionId },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: "FREE",
          paypalSubscriptionId: null,
        },
      });
      console.log(`Downgraded user ${user.id} to FREE tier`);
    }
  } catch (dbError) {
    console.error("Database update error:", dbError);
  }
}

async function handleSubscriptionSuspended(resource: any) {
  const subscriptionId = resource.id;

  console.log(`Subscription suspended: ${subscriptionId}`);

  try {
    const user = await prisma.user.findFirst({
      where: { paypalSubscriptionId: subscriptionId },
    });

    if (user) {
      // Mark subscription as suspended but keep tier for grace period
      // In production, you might want to add a suspendedAt field
      console.log(`User ${user.id} subscription suspended`);
    }
  } catch (dbError) {
    console.error("Database update error:", dbError);
  }
}

async function handlePaymentCompleted(resource: any) {
  const amount = resource.amount?.total;
  const billingAgreementId = resource.billing_agreement_id;

  console.log(`Payment completed: $${amount} for subscription ${billingAgreementId}`);

  // Record the payment in database for tracking
  // This is where you'd update payment history
}
