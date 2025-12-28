/**
 * Signal Executor Service
 * Handles the execution of copy trading signals through Tradovate
 */

import { TradovateClient, TradovateOrderResult } from "./client";

export interface TradeSignal {
  id: string;
  traderId: string;
  traderName: string;
  action: "LONG" | "SHORT" | "EXIT";
  symbol: string; // e.g., "ES", "NQ"
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number;
  timestamp: Date;
}

export interface BotSettings {
  enabled: boolean;
  maxDailyLoss: number;
  maxPositionSize: number;
  maxConcurrentTrades: number;
  autoExecute: boolean;
  allowLongs: boolean;
  allowShorts: boolean;
}

export interface TraderSettings {
  traderId: string;
  enabled: boolean;
  allocation: number; // percentage (0-100)
  copyMultiplier: number; // e.g., 0.5, 1.0, 2.0
  maxLossPerTrade: number;
  onlyPrimaryInstruments: boolean;
  primaryInstruments: string[];
  copyScaleOuts: boolean;
  useTraderStops: boolean;
}

export interface ExecutionResult {
  success: boolean;
  signalId: string;
  orderId?: number;
  executedPrice?: number;
  executedQty?: number;
  error?: string;
  timestamp: Date;
}

class SignalExecutor {
  private client: TradovateClient | null = null;
  private botSettings: BotSettings | null = null;
  private traderSettings: Map<string, TraderSettings> = new Map();
  private dailyLoss: number = 0;
  private openPositions: Map<string, number> = new Map(); // symbol -> quantity
  private accountId: number | null = null;

  /**
   * Initialize the executor with Tradovate client
   */
  initialize(
    client: TradovateClient,
    accountId: number,
    botSettings: BotSettings
  ): void {
    this.client = client;
    this.accountId = accountId;
    this.botSettings = botSettings;
    this.dailyLoss = 0;
    this.openPositions.clear();
  }

  /**
   * Add or update trader settings
   */
  setTraderSettings(settings: TraderSettings): void {
    this.traderSettings.set(settings.traderId, settings);
  }

  /**
   * Remove trader from copy list
   */
  removeTrader(traderId: string): void {
    this.traderSettings.delete(traderId);
  }

  /**
   * Process and execute a signal
   */
  async executeSignal(signal: TradeSignal): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      success: false,
      signalId: signal.id,
      timestamp: new Date(),
    };

    try {
      // Validate prerequisites
      if (!this.client || !this.accountId || !this.botSettings) {
        throw new Error("Executor not initialized");
      }

      if (!this.botSettings.enabled) {
        throw new Error("Bot is disabled");
      }

      if (!this.botSettings.autoExecute) {
        throw new Error("Auto-execute is disabled");
      }

      // Check trader settings
      const traderSettings = this.traderSettings.get(signal.traderId);
      if (!traderSettings || !traderSettings.enabled) {
        throw new Error(`Trader ${signal.traderId} is not enabled for copying`);
      }

      // Check direction permissions
      if (signal.action === "LONG" && !this.botSettings.allowLongs) {
        throw new Error("Long trades are disabled");
      }
      if (signal.action === "SHORT" && !this.botSettings.allowShorts) {
        throw new Error("Short trades are disabled");
      }

      // Check instrument filter
      if (
        traderSettings.onlyPrimaryInstruments &&
        !traderSettings.primaryInstruments.includes(signal.symbol)
      ) {
        throw new Error(
          `Instrument ${signal.symbol} not in allowed list for trader`
        );
      }

      // Check daily loss limit
      if (this.dailyLoss >= this.botSettings.maxDailyLoss) {
        throw new Error("Daily loss limit reached");
      }

      // Check concurrent trades limit
      if (this.openPositions.size >= this.botSettings.maxConcurrentTrades) {
        // If this is an exit signal, allow it
        if (signal.action !== "EXIT") {
          throw new Error("Max concurrent trades reached");
        }
      }

      // Calculate position size
      const baseQuantity = signal.quantity;
      let executionQty = Math.floor(baseQuantity * traderSettings.copyMultiplier);

      // Apply max position size limit
      executionQty = Math.min(executionQty, this.botSettings.maxPositionSize);

      // Must trade at least 1 contract
      if (executionQty < 1) {
        executionQty = 1;
      }

      // Get contract
      const contract = await this.client.getContractByName(
        this.getFrontMonthSymbol(signal.symbol)
      );
      if (!contract) {
        throw new Error(`Contract not found for symbol ${signal.symbol}`);
      }

      // Execute the trade
      let orderResult: TradovateOrderResult;

      if (signal.action === "EXIT") {
        // Close the position
        const currentQty = this.openPositions.get(signal.symbol) || 0;
        if (currentQty === 0) {
          throw new Error(`No open position in ${signal.symbol} to exit`);
        }

        const closeAction = currentQty > 0 ? "Sell" : "Buy";
        orderResult = await this.client.placeMarketOrder(
          this.accountId,
          contract.id,
          closeAction,
          Math.abs(currentQty),
          true
        );

        // Update tracking
        this.openPositions.delete(signal.symbol);
      } else {
        // Open a new position
        const action = signal.action === "LONG" ? "Buy" : "Sell";
        orderResult = await this.client.placeMarketOrder(
          this.accountId,
          contract.id,
          action,
          executionQty,
          true
        );

        // Update tracking
        const newQty =
          signal.action === "LONG" ? executionQty : -executionQty;
        this.openPositions.set(signal.symbol, newQty);
      }

      result.success = true;
      result.orderId = orderResult.orderId;
      result.executedPrice = orderResult.fillPrice;
      result.executedQty = orderResult.fillQty;

      console.log(`Signal executed: ${signal.action} ${signal.symbol}`, result);
    } catch (error: any) {
      result.error = error.message;
      console.error(`Signal execution failed:`, error);
    }

    return result;
  }

  /**
   * Get front month contract symbol (e.g., "ES" -> "ESH4" for March 2024)
   */
  private getFrontMonthSymbol(baseSymbol: string): string {
    // In production, this would calculate the correct front month
    // For now, return a placeholder
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear() % 100; // Get last 2 digits

    // Futures month codes: F(Jan), G(Feb), H(Mar), J(Apr), K(May), M(Jun),
    // N(Jul), Q(Aug), U(Sep), V(Oct), X(Nov), Z(Dec)
    const monthCodes = ["F", "G", "H", "J", "K", "M", "N", "Q", "U", "V", "X", "Z"];

    // Get the next quarterly month for index futures (H, M, U, Z)
    const quarterlyMonths = [2, 5, 8, 11]; // March, June, September, December
    let nextQuarter = quarterlyMonths.find((m) => m >= month);
    if (!nextQuarter) {
      nextQuarter = 2; // Roll to next year's March
    }

    const monthCode = monthCodes[nextQuarter];
    return `${baseSymbol}${monthCode}${year}`;
  }

  /**
   * Update daily loss tracking
   */
  updateDailyLoss(pnl: number): void {
    if (pnl < 0) {
      this.dailyLoss += Math.abs(pnl);
    }
  }

  /**
   * Reset daily tracking (call at market open)
   */
  resetDaily(): void {
    this.dailyLoss = 0;
  }

  /**
   * Get current status
   */
  getStatus(): {
    isInitialized: boolean;
    isEnabled: boolean;
    openPositions: number;
    dailyLossUsed: number;
    dailyLossLimit: number;
    tradersEnabled: number;
  } {
    return {
      isInitialized: !!this.client && !!this.accountId,
      isEnabled: this.botSettings?.enabled || false,
      openPositions: this.openPositions.size,
      dailyLossUsed: this.dailyLoss,
      dailyLossLimit: this.botSettings?.maxDailyLoss || 0,
      tradersEnabled: Array.from(this.traderSettings.values()).filter(
        (t) => t.enabled
      ).length,
    };
  }
}

// Export singleton instance
export const signalExecutor = new SignalExecutor();

// Export class for custom instances
export { SignalExecutor };
