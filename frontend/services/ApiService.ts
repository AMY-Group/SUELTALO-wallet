import config from '../constants/config';

const API_BASE_URL = config.backendUrl;

function ensureBaseUrl(): asserts API_BASE_URL is string {
  if (!API_BASE_URL) {
    throw new Error('BACKEND_URL is not configured. Please set REACT_APP_BACKEND_URL or EXPO_PUBLIC_BACKEND_URL');
  }
}

export class ApiService {
  private static getApiUrl(endpoint: string): string {
    ensureBaseUrl();
    return `${API_BASE_URL}/api${endpoint}`;
  }

  private static async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Wallet endpoints
  static async createWallet(publicKey: string, address: string) {
    return this.makeRequest(this.getApiUrl('/wallet'), {
      method: 'POST',
      body: JSON.stringify({ public_key: publicKey, address }),
    });
  }

  static async getWallet(publicKey: string) {
    return this.makeRequest(this.getApiUrl(`/wallet/${publicKey}`));
  }

  static async getWalletBalance(publicKey: string) {
    return this.makeRequest(this.getApiUrl(`/wallet/${publicKey}/balance`));
  }

  // Transaction endpoints
  static async createTransaction(transactionData: {
    from_address: string;
    to_address: string;
    amount: number;
    token_type: string;
    signature?: string;
  }) {
    return this.makeRequest(this.getApiUrl('/transaction'), {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  static async getTransactions(publicKey: string, limit: number = 50) {
    return this.makeRequest(this.getApiUrl(`/wallet/${publicKey}/transactions?limit=${limit}`));
  }

  static async updateTransactionStatus(transactionId: string, status: string, signature?: string) {
    const body: any = { status };
    if (signature) body.signature = signature;

    return this.makeRequest(this.getApiUrl(`/transaction/${transactionId}/status`), {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // KYC endpoints
  static async startKYC(walletAddress: string, email: string, fullName: string) {
    return this.makeRequest(this.getApiUrl('/kyc/start'), {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, email, full_name: fullName }),
    });
  }

  static async getKYCStatus(walletAddress: string) {
    return this.makeRequest(this.getApiUrl(`/kyc/status/${walletAddress}`));
  }

  // SLT Token endpoints
  static async airdropSLT(walletAddress: string, amount: number) {
    return this.makeRequest(this.getApiUrl('/slt/airdrop'), {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, amount }),
    });
  }

  // Devnet endpoints (moved here to avoid direct fetch in screens)
  static async getDevnetBalance(address: string) {
    return this.makeRequest(this.getApiUrl(`/devnet/balance/${address}`));
  }

  static async airdropSltDevnet(walletAddress: string, amount: number) {
    return this.makeRequest(this.getApiUrl(`/devnet/airdrop-slt`), {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress, amount }),
    });
  }

  static async getAirdropStats(address: string) {
    return this.makeRequest(this.getApiUrl(`/devnet/airdrop-stats/${address}`));
  }

  static async verifyTransaction(payload: any) {
    return this.makeRequest(this.getApiUrl(`/devnet/verify-transaction`), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Health check
  static async healthCheck() {
    return this.makeRequest(this.getApiUrl('/health'));
  }
}
