/**
 * PayPal API Client
 * Handles subscription management and profit share payments
 */

const PAYPAL_API_URLS = {
  sandbox: "https://api-m.sandbox.paypal.com",
  production: "https://api-m.paypal.com",
};

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "production";
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "MONTH" | "YEAR";
  trialDays?: number;
}

export interface Subscription {
  id: string;
  planId: string;
  status: "ACTIVE" | "CANCELLED" | "SUSPENDED" | "PENDING";
  startDate: string;
  nextBillingDate: string;
  subscriber: {
    email: string;
    name: string;
  };
}

export interface PayoutItem {
  recipientType: "EMAIL" | "PAYPAL_ID";
  recipient: string;
  amount: number;
  currency: string;
  note?: string;
}

class PayPalClient {
  private config: PayPalConfig | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private get apiUrl(): string {
    return PAYPAL_API_URLS[this.config?.environment || "sandbox"];
  }

  /**
   * Initialize with PayPal credentials
   */
  initialize(config: PayPalConfig): void {
    this.config = config;
  }

  /**
   * Get access token
   */
  private async getAccessToken(): Promise<string> {
    if (!this.config) {
      throw new Error("PayPal client not initialized");
    }

    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to get PayPal access token");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

    return this.accessToken!;
  }

  /**
   * Make authenticated API request
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PayPal API error: ${response.status} - ${error}`);
    }

    // Handle no content responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Create a subscription plan
   */
  async createPlan(plan: {
    productId: string;
    name: string;
    description: string;
    price: number;
    interval: "MONTH" | "YEAR";
    trialDays?: number;
  }): Promise<{ id: string }> {
    const billingCycles = [];

    // Add trial period if specified
    if (plan.trialDays && plan.trialDays > 0) {
      billingCycles.push({
        frequency: {
          interval_unit: "DAY",
          interval_count: plan.trialDays,
        },
        tenure_type: "TRIAL",
        sequence: 1,
        total_cycles: 1,
        pricing_scheme: {
          fixed_price: {
            value: "0",
            currency_code: "USD",
          },
        },
      });
    }

    // Regular billing cycle
    billingCycles.push({
      frequency: {
        interval_unit: plan.interval,
        interval_count: 1,
      },
      tenure_type: "REGULAR",
      sequence: plan.trialDays ? 2 : 1,
      total_cycles: 0, // Infinite
      pricing_scheme: {
        fixed_price: {
          value: plan.price.toFixed(2),
          currency_code: "USD",
        },
      },
    });

    const result = await this.fetch<{ id: string }>("/v1/billing/plans", {
      method: "POST",
      body: JSON.stringify({
        product_id: plan.productId,
        name: plan.name,
        description: plan.description,
        billing_cycles: billingCycles,
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });

    return result;
  }

  /**
   * Create a product for subscription plans
   */
  async createProduct(
    name: string,
    description: string,
    type: "SERVICE" | "PHYSICAL" | "DIGITAL" = "SERVICE"
  ): Promise<{ id: string }> {
    return this.fetch<{ id: string }>("/v1/catalogs/products", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        type,
        category: "SOFTWARE",
      }),
    });
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    planId: string,
    returnUrl: string,
    cancelUrl: string,
    subscriberEmail?: string
  ): Promise<{ id: string; approvalUrl: string }> {
    const result = await this.fetch<{ id: string; links: { rel: string; href: string }[] }>(
      "/v1/billing/subscriptions",
      {
        method: "POST",
        body: JSON.stringify({
          plan_id: planId,
          subscriber: subscriberEmail
            ? { email_address: subscriberEmail }
            : undefined,
          application_context: {
            brand_name: "TradeTV",
            user_action: "SUBSCRIBE_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        }),
      }
    );

    const approvalLink = result.links.find((l) => l.rel === "approve");
    return {
      id: result.id,
      approvalUrl: approvalLink?.href || "",
    };
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    const result = await this.fetch<any>(`/v1/billing/subscriptions/${subscriptionId}`);
    return {
      id: result.id,
      planId: result.plan_id,
      status: result.status,
      startDate: result.start_time,
      nextBillingDate: result.billing_info?.next_billing_time || "",
      subscriber: {
        email: result.subscriber?.email_address || "",
        name: result.subscriber?.name?.given_name || "",
      },
    };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    await this.fetch(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      body: JSON.stringify({
        reason: reason || "User requested cancellation",
      }),
    });
  }

  /**
   * Suspend a subscription
   */
  async suspendSubscription(subscriptionId: string, reason?: string): Promise<void> {
    await this.fetch(`/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      method: "POST",
      body: JSON.stringify({
        reason: reason || "Subscription suspended",
      }),
    });
  }

  /**
   * Reactivate a suspended subscription
   */
  async activateSubscription(subscriptionId: string, reason?: string): Promise<void> {
    await this.fetch(`/v1/billing/subscriptions/${subscriptionId}/activate`, {
      method: "POST",
      body: JSON.stringify({
        reason: reason || "Subscription reactivated",
      }),
    });
  }

  /**
   * Create a payout (for profit share payments to traders)
   */
  async createPayout(items: PayoutItem[]): Promise<{ batchId: string }> {
    const result = await this.fetch<{ batch_header: { payout_batch_id: string } }>(
      "/v1/payments/payouts",
      {
        method: "POST",
        body: JSON.stringify({
          sender_batch_header: {
            sender_batch_id: `payout_${Date.now()}`,
            email_subject: "TradeTV Profit Share Payment",
            email_message: "You have received a profit share payment from TradeTV.",
          },
          items: items.map((item, index) => ({
            recipient_type: item.recipientType,
            amount: {
              value: item.amount.toFixed(2),
              currency: item.currency,
            },
            [item.recipientType === "EMAIL" ? "receiver" : "recipient_wallet"]:
              item.recipient,
            note: item.note || "TradeTV Profit Share",
            sender_item_id: `item_${index + 1}`,
          })),
        }),
      }
    );

    return { batchId: result.batch_header.payout_batch_id };
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(
    batchId: string
  ): Promise<{ status: string; items: any[] }> {
    const result = await this.fetch<any>(`/v1/payments/payouts/${batchId}`);
    return {
      status: result.batch_header.batch_status,
      items: result.items || [],
    };
  }

  /**
   * Create a payment order (one-time payment)
   */
  async createOrder(
    amount: number,
    description: string,
    returnUrl: string,
    cancelUrl: string
  ): Promise<{ id: string; approvalUrl: string }> {
    const result = await this.fetch<{ id: string; links: { rel: string; href: string }[] }>(
      "/v2/checkout/orders",
      {
        method: "POST",
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: amount.toFixed(2),
              },
              description,
            },
          ],
          application_context: {
            brand_name: "TradeTV",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        }),
      }
    );

    const approvalLink = result.links.find((l) => l.rel === "approve");
    return {
      id: result.id,
      approvalUrl: approvalLink?.href || "",
    };
  }

  /**
   * Capture a payment order
   */
  async captureOrder(orderId: string): Promise<{ id: string; status: string }> {
    const result = await this.fetch<{ id: string; status: string }>(
      `/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
      }
    );
    return result;
  }
}

// Export singleton instance
export const paypal = new PayPalClient();

// Export class for custom instances
export { PayPalClient };
