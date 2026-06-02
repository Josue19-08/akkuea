import { Buffer } from "buffer";
import type {
  AssembledTransaction,
  ClientOptions as ContractClientOptions,
  MethodOptions,
} from "@stellar/stellar-sdk/contract";
import {
  Client as ContractClient,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";

// Timepoint and Duration are not exported by stellar-sdk/contract in v13.x
export type Timepoint = bigint;
export type Duration = bigint;

if (typeof globalThis !== "undefined" && !globalThis.Buffer) {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}

export class MarketplaceClient extends ContractClient {
  static override async deploy<T = MarketplaceClient>(
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        wasmHash: Buffer | string;
        salt?: Buffer | Uint8Array;
        format?: "hex" | "base64";
      },
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options);
  }

  constructor(public override readonly options: ContractClientOptions) {
    super(new ContractSpec(["AAAAAAAAAAAAAAAEaW5pdAAAAAAAAAAA"]), options);
  }

  public readonly fromJSON = {
    init: this.txFromJSON<null>,
  };
}
