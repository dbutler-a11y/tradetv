/**
 * Tradovate API Client
 * Handles authentication and trading operations with Tradovate
 */

const TRADOVATE_API_URLS = {
  demo: "https://demo.tradovateapi.com/v1",
  live: "https://live.tradovateapi.com/v1",
};

const TRADOVATE_MARKET_DATA_URLS = {
  demo: "wss://md.tradovateapi.com/v1/websocket",
  live: "wss://md.tradovateapi.com/v1/websocket",
};

export interface TradovateCredentials {
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
  deviceId?: string;
}

export interface TradovateAuthResponse {
  accessToken: string;
  expirationTime: string;
  userId: number;
  name: string;
  mdAccessToken?: string;
}

export interface TradovateAccount {
  id: number;
  name: string;
  userId: number;
  accountType: string;
  active: boolean;
  marginAccountType: string;
}

export interface TradovatePosition {
  id: number;
  accountId: number;
  contractId: number;
  contractName: string;
  netPos: number;
  avgPrice: number;
  openPnl: number;
  realizedPnl: number;
}

export interface TradovateOrder {
  id?: number;
  accountId: number;
  contractId: number;
  action: "Buy" | "Sell";
  orderQty: number;
  orderType: "Market" | "Limit" | "Stop" | "StopLimit";
  price?: number;
  stopPrice?: number;
  isAutomated?: boolean;
}

export interface TradovateOrderResult {
  orderId: number;
  orderStatus: string;
  fillPrice?: number;
  fillQty?: number;
}

export interface TradovateFill {
  id: number;
  orderId: number;
  contractId: number;
  qty: number;
  price: number;
  action: string;
  timestamp: string;
}

class TradovateClient {
  private environment: "demo" | "live";
  private accessToken: string | null = null;
  private mdAccessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private userId: number | null = null;
  private credentials: TradovateCredentials | null = null;

  constructor(environment: "demo" | "live" = "demo") {
    this.environment = environment;
  }

  private get apiUrl(): string {
    return TRADOVATE_API_URLS[this.environment];
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Call authenticate() first.");
    }

    // Check if token is expired
    if (this.tokenExpiry && new Date() >= this.tokenExpiry) {
      await this.refreshToken();
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tradovate API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Authenticate with Tradovate API
   */
  async authenticate(
    credentials: TradovateCredentials
  ): Promise<TradovateAuthResponse> {
    this.credentials = credentials;

    const response = await fetch(`${this.apiUrl}/auth/accesstokenrequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: credentials.username,
        password: credentials.password,
        appId: credentials.clientId,
        appVersion: "1.0",
        cid: credentials.clientId,
        sec: credentials.clientSecret,
        deviceId: credentials.deviceId || this.generateDeviceId(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Authentication failed: ${error}`);
    }

    const data: TradovateAuthResponse = await response.json();

    this.accessToken = data.accessToken;
    this.mdAccessToken = data.mdAccessToken || null;
    this.tokenExpiry = new Date(data.expirationTime);
    this.userId = data.userId;

    return data;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    if (!this.credentials) {
      throw new Error("No credentials stored. Call authenticate() first.");
    }
    await this.authenticate(this.credentials);
  }

  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    return `tradetv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get all accounts for the authenticated user
   */
  async getAccounts(): Promise<TradovateAccount[]> {
    return this.fetch<TradovateAccount[]>("/account/list");
  }

  /**
   * Get a specific account by ID
   */
  async getAccount(accountId: number): Promise<TradovateAccount> {
    return this.fetch<TradovateAccount>(`/account/item?id=${accountId}`);
  }

  /**
   * Get all positions for an account
   */
  async getPositions(accountId: number): Promise<TradovatePosition[]> {
    return this.fetch<TradovatePosition[]>(
      `/position/list?masterid=${accountId}`
    );
  }

  /**
   * Get contract by name (e.g., "ESH4" for ES March 2024)
   */
  async getContractByName(name: string): Promise<any> {
    const contracts = await this.fetch<any[]>(
      `/contract/find?name=${encodeURIComponent(name)}`
    );
    return contracts[0] || null;
  }

  /**
   * Get contract by ID
   */
  async getContract(contractId: number): Promise<any> {
    return this.fetch<any>(`/contract/item?id=${contractId}`);
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(
    accountId: number,
    contractId: number,
    action: "Buy" | "Sell",
    quantity: number,
    isAutomated: boolean = true
  ): Promise<TradovateOrderResult> {
    const order: TradovateOrder = {
      accountId,
      contractId,
      action,
      orderQty: quantity,
      orderType: "Market",
      isAutomated,
    };

    return this.fetch<TradovateOrderResult>("/order/placeorder", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(
    accountId: number,
    contractId: number,
    action: "Buy" | "Sell",
    quantity: number,
    price: number,
    isAutomated: boolean = true
  ): Promise<TradovateOrderResult> {
    const order: TradovateOrder = {
      accountId,
      contractId,
      action,
      orderQty: quantity,
      orderType: "Limit",
      price,
      isAutomated,
    };

    return this.fetch<TradovateOrderResult>("/order/placeorder", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  /**
   * Place a stop order
   */
  async placeStopOrder(
    accountId: number,
    contractId: number,
    action: "Buy" | "Sell",
    quantity: number,
    stopPrice: number,
    isAutomated: boolean = true
  ): Promise<TradovateOrderResult> {
    const order: TradovateOrder = {
      accountId,
      contractId,
      action,
      orderQty: quantity,
      orderType: "Stop",
      stopPrice,
      isAutomated,
    };

    return this.fetch<TradovateOrderResult>("/order/placeorder", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number): Promise<void> {
    await this.fetch("/order/cancelorder", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(
    orderId: number,
    updates: Partial<{
      orderQty: number;
      price: number;
      stopPrice: number;
    }>
  ): Promise<TradovateOrderResult> {
    return this.fetch<TradovateOrderResult>("/order/modifyorder", {
      method: "POST",
      body: JSON.stringify({ orderId, ...updates }),
    });
  }

  /**
   * Liquidate a position (close all contracts)
   */
  async liquidatePosition(accountId: number, contractId: number): Promise<void> {
    await this.fetch("/order/liquidateposition", {
      method: "POST",
      body: JSON.stringify({ accountId, contractId, admin: false }),
    });
  }

  /**
   * Get all fills (executed trades) for an account
   */
  async getFills(accountId: number): Promise<TradovateFill[]> {
    return this.fetch<TradovateFill[]>(`/fill/list?masterid=${accountId}`);
  }

  /**
   * Get all open orders for an account
   */
  async getOpenOrders(accountId: number): Promise<any[]> {
    return this.fetch<any[]>(`/order/list?masterid=${accountId}`);
  }

  /**
   * Get account cash balance
   */
  async getCashBalance(accountId: number): Promise<{
    realizedPnl: number;
    openPnl: number;
    availableFunds: number;
    marginUsed: number;
  }> {
    const balance = await this.fetch<any>(
      `/cashBalance/getcashbalancesnapshot?accountId=${accountId}`
    );
    return {
      realizedPnl: balance.realizedPnl || 0,
      openPnl: balance.openPnl || 0,
      availableFunds: balance.availableFunds || 0,
      marginUsed: balance.marginUsed || 0,
    };
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return (
      !!this.accessToken &&
      !!this.tokenExpiry &&
      new Date() < this.tokenExpiry
    );
  }

  /**
   * Get user ID
   */
  getUserId(): number | null {
    return this.userId;
  }
}

// Export singleton instances for demo and live
export const tradovateDemo = new TradovateClient("demo");
export const tradovateLive = new TradovateClient("live");

// Export class for custom instances
export { TradovateClient };
