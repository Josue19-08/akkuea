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
import type { u32, u64, Option } from "@stellar/stellar-sdk/contract";

// Timepoint and Duration are not exported by stellar-sdk/contract in v13.x
export type Timepoint = bigint;
export type Duration = bigint;

if (typeof globalThis !== "undefined" && !globalThis.Buffer) {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}

export interface PropertyMeta {
  approved_spender: u32;
  last_claimed_ledger: u64;
  level: u32;
}

export interface PropertyOwner {
  address: string;
}

export interface PropertyCoords {
  x: u32;
  y: u32;
}

export interface PropertyState {
  approved: Option<string>;
  id: u32;
  last_claimed_ledger: u64;
  level: u32;
  owner: string;
  x: u32;
  y: u32;
}

export const NftError = {
  1: { message: "AlreadyInitialized" },
  2: { message: "NotOwner" },
  3: { message: "NotApproved" },
  4: { message: "InvalidProperty" },
  5: { message: "ContractPaused" },
  6: { message: "Unauthorized" },
};

export interface PropertyNftClientInterface {
  /** Pause the contract. */
  pause: (
    { admin }: { admin: string },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  /** Approve spender. */
  approve: (
    {
      owner,
      spender,
      property_id,
    }: { owner: string; spender: string; property_id: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  /** Unpause the contract. */
  unpause: (
    { admin }: { admin: string },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  /** Transfer property. */
  transfer: (
    { from, to, property_id }: { from: string; to: string; property_id: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  get_owner: (
    { property_id }: { property_id: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<string>>;
  /** Mint all 400 tiles to `treasury` logically. */
  initialize: (
    { treasury, game_engine }: { treasury: string; game_engine: string },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  /** Get property. */
  get_property: (
    { property_id }: { property_id: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<PropertyState>>;
  list_by_owner: (
    { owner }: { owner: string },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<Array<u32>>>;
  /** Transfer from approved spender. */
  transfer_from: (
    {
      spender,
      from,
      to,
      property_id,
    }: { spender: string; from: string; to: string; property_id: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  set_improvement_level: (
    {
      caller,
      property_id,
      level,
    }: { caller: string; property_id: u32; level: u32 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
  set_last_claimed_ledger: (
    {
      caller,
      property_id,
      ledger,
    }: { caller: string; property_id: u32; ledger: u64 },
    options?: MethodOptions,
  ) => Promise<AssembledTransaction<null>>;
}

export class PropertyNftClient extends ContractClient {
  static override async deploy<T = PropertyNftClient>(
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
    super(
      new ContractSpec([
        "AAAAAQAAAAAAAAAAAAAADFByb3BlcnR5TWV0YQAAAAMAAAAAAAAAEGFwcHJvdmVkX3NwZW5kZXIAAAAEAAAAAAAAABNsYXN0X2NsYWltZWRfbGVkZ2VyAAAAAAYAAAAAAAAABWxldmVsAAAAAAAABA==",
        "AAAAAQAAAAAAAAAAAAAADVByb3BlcnR5T3duZXIAAAAAAAABAAAAAAAAAAdhZGRyZXNzAAAAABM=",
        "AAAAAQAAAAAAAAAAAAAADlByb3BlcnR5Q29vcmRzAAAAAAACAAAAAAAAAAF4AAAAAAAABAAAAAAAAAABeQAAAAAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADVByb3BlcnR5U3RhdGUAAAAAAAAHAAAAAAAAAAhhcHByb3ZlZAAAA+gAAAATAAAAAAAAAAJpZAAAAAAABAAAAAAAAAATbGFzdF9jbGFpbWVkX2xlZGdlcgAAAAAGAAAAAAAAAAVsZXZlbAAAAAAAAAQAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAABeAAAAAAAAAQAAAAAAAAAAXkAAAAAAAAE",
        "AAAAAAAAAAAAAAAFcGF1c2UAAAAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAAA9BcHByb3ZlIHNwZW5kZXIAAAAAB2FwcHJvdmUAAAAAAwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAdzcGVuZGVyAAAAABMAAAAAAAAAC3Byb3BlcnR5X2lkAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAHdW5wYXVzZQAAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAABFUcmFuc2ZlciBwcm9wZXJ0eQAAAAAAAAh0cmFuc2ZlcgAAAAMAAAAAAAAABGZyb20AAAATAAAAAAAAAAJ0bwAAAAAAEwAAAAAAAAALcHJvcGVydHlfaWQAAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAJZ2V0X293bmVyAAAAAAAAAQAAAAAAAAALcHJvcGVydHlfaWQAAAAABAAAAAEAAAAT",
        "AAAAAAAAACtNaW50IGFsbCA0MDAgdGlsZXMgdG8gYHRyZWFzdXJ5YCBsb2dpY2FsbHkuAAAAAAppbml0aWFsaXplAAAAAAACAAAAAAAAAAh0cmVhc3VyeQAAABMAAAAAAAAAC2dhbWVfZW5naW5lAAAAABMAAAAA",
        "AAAAAAAAAAxHZXQgcHJvcGVydHkAAAAMZ2V0X3Byb3BlcnR5AAAAAQAAAAAAAAALcHJvcGVydHlfaWQAAAAABAAAAAEAAAfQAAAADVByb3BlcnR5U3RhdGUAAAA=",
        "AAAAAAAAAAAAAAANbGlzdF9ieV9vd25lcgAAAAAAAAEAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAPqAAAABA==",
        "AAAAAAAAAB5UcmFuc2ZlciBmcm9tIGFwcHJvdmVkIHNwZW5kZXIAAAAAAA10cmFuc2Zlcl9mcm9tAAAAAAAABAAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAAC3Byb3BlcnR5X2lkAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAVc2V0X2ltcHJvdmVtZW50X2xldmVsAAAAAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAtwcm9wZXJ0eV9pZAAAAAAEAAAAAAAAAAVsZXZlbAAAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAXc2V0X2xhc3RfY2xhaW1lZF9sZWRnZXIAAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAtwcm9wZXJ0eV9pZAAAAAAEAAAAAAAAAAZsZWRnZXIAAAAAAAYAAAAA",
        "AAAABAAAAAAAAAAAAAAACE5mdEVycm9yAAAABgAAAAAAAAASQWxyZWFkeUluaXRpYWxpemVkAAAAAAABAAAAAAAAAAhOb3RPd25lcgAAAAIAAAAAAAAAC05vdEFwcHJvdmVkAAAAAAMAAAAAAAAAD0ludmFsaWRQcm9wZXJ0eQAAAAAEAAAAAAAAAA5Db250cmFjdFBhdXNlZAAAAAAABQAAAAAAAAAMVW5hdXRob3JpemVkAAAABg==",
        "AAAABQAAAAAAAAAAAAAADEFwcHJvdmVFdmVudAAAAAEAAAANYXBwcm92ZV9ldmVudAAAAAAAAAMAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAAAAAAAmlkAAAAAAAEAAAAAAAAAAI=",
        "AAAABQAAAAAAAAAAAAAADVRyYW5zZmVyRXZlbnQAAAAAAAABAAAADnRyYW5zZmVyX2V2ZW50AAAAAAADAAAAAAAAAARmcm9tAAAD6AAAABMAAAAAAAAAAAAAAAJ0bwAAAAAAEwAAAAAAAAAAAAAAAmlkAAAAAAAEAAAAAAAAAAI=",
      ]),
      options,
    );
  }

  public readonly fromJSON = {
    pause: this.txFromJSON<null>,
    approve: this.txFromJSON<null>,
    unpause: this.txFromJSON<null>,
    transfer: this.txFromJSON<null>,
    get_owner: this.txFromJSON<string>,
    initialize: this.txFromJSON<null>,
    get_property: this.txFromJSON<PropertyState>,
    list_by_owner: this.txFromJSON<Array<u32>>,
    transfer_from: this.txFromJSON<null>,
    set_improvement_level: this.txFromJSON<null>,
    set_last_claimed_ledger: this.txFromJSON<null>,
  };
}
