import { NextRequest, NextResponse } from "next/server";
import { paypal } from "@/lib/paypal/client";

// Initialize PayPal client if credentials are available
const initPayPal = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const environment = (process.env.PAYPAL_ENVIRONMENT || "sandbox") as "sandbox" | "production";

  if (clientId && clientSecret) {
    paypal.initialize({ clientId, clientSecret, environment });
    return true;
  }
  return false;
};

// Subscription plan IDs (would be stored in database in production)
const PLANS = {
  starter: process.env.PAYPAL_PLAN_STARTER || "",
  pro: process.env.PAYPAL_PLAN_PRO || "",
  elite: process.env.PAYPAL_PLAN_ELITE || "",
};

/**
 * POST /api/subscription
 * Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    if (!initPayPal()) {
      return NextResponse.json(
        { error: "PayPal not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { planType, userEmail } = body;

    if (!planType || !["starter", "pro", "elite"].includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    const planId = PLANS[planType as keyof typeof PLANS];
    if (!planId) {
      return NextResponse.json(
        { error: `Plan ${planType} not configured` },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/subscription/success`;
    const cancelUrl = `${baseUrl}/subscription/cancel`;

    const subscription = await paypal.createSubscription(
      planId,
      returnUrl,
      cancelUrl,
      userEmail
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl: subscription.approvalUrl,
    });
  } catch (error: any) {
    console.error("Subscription creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription
 * Get subscription details
 */
export async function GET(request: NextRequest) {
  try {
    if (!initPayPal()) {
      return NextResponse.json(
        { error: "PayPal not configured" },
        { status: 500 }
      );
    }

    const subscriptionId = request.nextUrl.searchParams.get("id");
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID required" },
        { status: 400 }
      );
    }

    const subscription = await paypal.getSubscription(subscriptionId);
    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get subscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscription
 * Cancel a subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!initPayPal()) {
      return NextResponse.json(
        { error: "PayPal not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { subscriptionId, reason } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID required" },
        { status: 400 }
      );
    }

    await paypal.cancelSubscription(subscriptionId, reason);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
