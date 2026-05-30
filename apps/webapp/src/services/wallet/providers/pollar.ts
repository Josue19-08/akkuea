import type { WalletProvider } from "../types";

const POLLAR_API_BASE = "https://api.pollar.io/v1";

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
    const res = await fetch(`${POLLAR_API_BASE}/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Pollar connect failed: ${res.status} ${res.statusText}`);
    }

    const { address } = (await res.json()) as { address: string };
    this._isConnected = true;
    return { address };
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
  }
}
