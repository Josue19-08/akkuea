import type { WalletProvider } from "../types";

export class PollarProvider implements WalletProvider {
  readonly id = "pollar";
  readonly name = "Pollar";

  private _isConnected = false;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<{ address: string }> {
    const { Pollar } = await import("@pollar-wallet/sdk");
    const pollar = new Pollar({ apiKey: this.apiKey });
    const { address } = await pollar.connect();
    this._isConnected = true;
    return { address };
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
  }
}
