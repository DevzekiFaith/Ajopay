// Paystack integration utilities for AjoPay

export interface PaystackConfig {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
}

export interface PaymentData {
  amount: number; // in Naira
  email: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface TransferData {
  amount: number; // in Naira
  recipient_code: string;
  reason?: string;
  reference?: string;
}

export interface BankAccount {
  account_number: string;
  bank_code: string;
  account_name?: string;
}

export class PaystackService {
  private config: PaystackConfig;

  constructor() {
    this.config = {
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      secretKey: process.env.PAYSTACK_SECRET_KEY || '',
      baseUrl: 'https://api.paystack.co'
    };
  }

  // Initialize payment for deposits
  async initializePayment(paymentData: PaymentData) {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentData.amount * 100, // Convert to kobo
          email: paymentData.email,
          reference: paymentData.reference,
          callback_url: paymentData.callback_url,
          metadata: paymentData.metadata
        })
      });

      const payload = await response.json().catch(async () => ({
        status: false,
        message: await response.text()
      }));
      if (!response.ok || payload?.status === false) {
        const message = payload?.message || response.statusText;
        throw new Error(`Paystack API error: ${message}`);
      }

      return payload;
    } catch (error) {
      console.error('Paystack payment initialization error:', error);
      throw error;
    }
  }

  // Verify payment status
  async verifyPayment(reference: string) {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`
        }
      });

      const payload = await response.json().catch(async () => ({
        status: false,
        message: await response.text()
      }));
      if (!response.ok || payload?.status === false) {
        const message = payload?.message || response.statusText;
        throw new Error(`Paystack API error: ${message}`);
      }

      return payload;
    } catch (error) {
      console.error('Paystack payment verification error:', error);
      throw error;
    }
  }

  // Verify bank account
  async verifyBankAccount(accountNumber: string, bankCode: string) {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.secretKey}`
          }
        }
      );

      const payload = await response.json().catch(async () => ({
        status: false,
        message: await response.text()
      }));
      if (!response.ok || payload?.status === false) {
        const message = payload?.message || response.statusText;
        throw new Error(`Paystack API error: ${message}`);
      }

      return payload;
    } catch (error) {
      console.error('Paystack bank verification error:', error);
      throw error;
    }
  }

  // Create transfer recipient
  async createTransferRecipient(accountData: BankAccount) {
    try {
      const response = await fetch(`${this.config.baseUrl}/transferrecipient`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'nuban',
          name: accountData.account_name || 'Account Holder',
          account_number: accountData.account_number,
          bank_code: accountData.bank_code,
          currency: 'NGN'
        })
      });

      const payload = await response.json().catch(async () => ({
        status: false,
        message: await response.text()
      }));
      if (!response.ok || payload?.status === false) {
        const message = payload?.message || response.statusText;
        throw new Error(`Paystack API error: ${message}`);
      }

      return payload;
    } catch (error) {
      console.error('Paystack transfer recipient creation error:', error);
      throw error;
    }
  }

  // Create transfer
  async createTransfer(transferData: TransferData) {
    try {
      const response = await fetch(`${this.config.baseUrl}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: 'balance',
          amount: transferData.amount * 100, // Convert to kobo
          recipient: transferData.recipient_code,
          reason: transferData.reason || 'Withdrawal from AjoPay wallet',
          reference: transferData.reference
        })
      });

      const payload = await response.json().catch(async () => ({
        status: false,
        message: await response.text()
      }));
      if (!response.ok || payload?.status === false) {
        const message = payload?.message || response.statusText;
        throw new Error(`Paystack API error: ${message}`);
      }

      return payload;
    } catch (error) {
      console.error('Paystack transfer creation error:', error);
      throw error;
    }
  }

  // Get banks list
  async getBanks() {
    try {
      const response = await fetch(`${this.config.baseUrl}/bank`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`
        }
      });

      const payload = await response.json().catch(async () => ({
        status: false,
        message: await response.text()
      }));
      if (!response.ok || payload?.status === false) {
        const message = payload?.message || response.statusText;
        throw new Error(`Paystack API error: ${message}`);
      }

      return payload;
    } catch (error) {
      console.error('Paystack banks fetch error:', error);
      throw error;
    }
  }

  // Check if Paystack is configured
  isConfigured(): boolean {
    return !!(this.config.publicKey && this.config.secretKey);
  }

  // Get public key for frontend
  getPublicKey(): string {
    return this.config.publicKey;
  }

  // Fetch Paystack balance (sum available balances in NGN)
  async getBalanceKobo(): Promise<number> {
    try {
      const response = await fetch(`${this.config.baseUrl}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`
        }
      });

      const payload = await response.json().catch(async () => ({
        status: false,
        message: await response.text()
      }));
      if (!response.ok || payload?.status === false) {
        const message = payload?.message || response.statusText;
        throw new Error(`Paystack API error: ${message}`);
      }

      // payload.data is an array of balances; pick NGN and available_balance
      const balances: Array<{ currency: string; balance: number; pending_balance: number }> = payload.data || [];
      const ngn = balances.find(b => b.currency === 'NGN');
      return ngn ? (ngn.balance || 0) : 0;
    } catch (error) {
      console.error('Paystack balance fetch error:', error);
      // If balance API fails, return 0 so we fail-fast upstream
      return 0;
    }
  }
}

// Export singleton instance
export const paystackService = new PaystackService();
