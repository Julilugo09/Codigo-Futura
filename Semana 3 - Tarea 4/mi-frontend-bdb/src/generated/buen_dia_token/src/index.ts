import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CBIOVVR3JMQRPMUVK5QEERETJSUM6AUUNIYRW3BNPZ4YKAR4P3A4YNBG",
  }
} as const

/**
 * Enum que define todas las claves de almacenamiento
 * 
 * Separamos los datos en dos tipos de storage:
 * - Instance Storage: Metadatos globales (más barato)
 * - Persistent Storage: Datos de usuarios (requiere TTL)
 */
export type DataKey = {tag: "Balance", values: readonly [string]} | {tag: "Allowance", values: readonly [string, string]} | {tag: "TotalSupply", values: void} | {tag: "Admin", values: void} | {tag: "TokenName", values: void} | {tag: "TokenSymbol", values: void} | {tag: "Decimals", values: void} | {tag: "Initialized", values: void};


/**
 * Metadata struct para almacenar información del token
 * Usado en initialize() para pasar múltiples parámetros
 */
export interface TokenMetadata {
  decimals: u32;
  name: string;
  symbol: string;
}

/**
 * Enum de errores personalizados para el token
 * 
 * Cada error tiene un código único para debugging en el ledger
 * Los códigos empiezan en 1 (0 está reservado para "sin error")
 */
export const TokenError = {
  /**
   * El contrato ya fue inicializado
   * Se lanza si se intenta llamar initialize() dos veces
   */
  1: {message:"AlreadyInitialized"},
  /**
   * Amount debe ser mayor a 0
   * Transferencias, mint, burn, etc. no aceptan 0
   */
  2: {message:"InvalidAmount"},
  /**
   * Balance insuficiente para la operación
   * El usuario no tiene suficientes tokens
   */
  3: {message:"InsufficientBalance"},
  /**
   * Allowance insuficiente para transfer_from
   * El spender no tiene permiso suficiente
   */
  4: {message:"InsufficientAllowance"},
  /**
   * El contrato no ha sido inicializado
   * Todas las operaciones requieren initialize() primero
   */
  5: {message:"NotInitialized"},
  /**
   * Decimales inválidos (máximo 18)
   * Por convención, Stellar usa 7, Ethereum 18
   */
  6: {message:"InvalidDecimals"},
  /**
   * Overflow en operación aritmética
   * checked_add/checked_sub detectó overflow
   */
  7: {message:"OverflowError"},
  /**
   * Transferencia a sí mismo no permitida
   * from == to (optimización de gas)
   */
  8: {message:"InvalidRecipient"},
  /**
   * Nombre o símbolo inválido (vacío o muy largo)
   * Validación de metadatos en initialize()
   */
  9: {message:"InvalidMetadata"}
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: ({admin, name, symbol, decimals}: {admin: string, name: string, symbol: string, decimals: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  mint: ({to, amount}: {to: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a burn transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  burn: ({from, amount}: {from: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance: ({account}: {account: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer: ({from, to, amount}: {from: string, to: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve: ({from, spender, amount}: {from: string, spender: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  allowance: ({from, spender}: {from: string, spender: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_from: ({spender, from, to, amount}: {spender: string, from: string, to: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  name: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  symbol: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a decimals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  decimals: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  total_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  admin: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAMxFbnVtIHF1ZSBkZWZpbmUgdG9kYXMgbGFzIGNsYXZlcyBkZSBhbG1hY2VuYW1pZW50bwoKU2VwYXJhbW9zIGxvcyBkYXRvcyBlbiBkb3MgdGlwb3MgZGUgc3RvcmFnZToKLSBJbnN0YW5jZSBTdG9yYWdlOiBNZXRhZGF0b3MgZ2xvYmFsZXMgKG3DoXMgYmFyYXRvKQotIFBlcnNpc3RlbnQgU3RvcmFnZTogRGF0b3MgZGUgdXN1YXJpb3MgKHJlcXVpZXJlIFRUTCkAAAAAAAAAB0RhdGFLZXkAAAAACAAAAAEAAABSQmFsYW5jZSBkZSBjYWRhIHVzdWFyaW8gLSBQZXJzaXN0ZW50IFN0b3JhZ2UKVXNhIEFkZHJlc3MgY29tbyBrZXkgcGFyYSBhY2Nlc28gTygxKQAAAAAAB0JhbGFuY2UAAAAAAQAAABMAAAABAAAAYlBlcm1pc29zIGRlIGdhc3RvIGVudHJlIHVzdWFyaW9zIC0gUGVyc2lzdGVudCBTdG9yYWdlClR1cGxhIChvd25lciwgc3BlbmRlcikgcGFyYSBsb29rdXAgZWZpY2llbnRlAAAAAAAJQWxsb3dhbmNlAAAAAAAAAgAAABMAAAATAAAAAAAAAFNTdXBwbHkgdG90YWwgZGUgdG9rZW5zIC0gSW5zdGFuY2UgU3RvcmFnZQpDb250YWRvciBnbG9iYWwgZGUgdG9rZW5zIGVuIGNpcmN1bGFjacOzbgAAAAALVG90YWxTdXBwbHkAAAAAAAAAAFVEaXJlY2Npw7NuIGRlbCBhZG1pbmlzdHJhZG9yIC0gSW5zdGFuY2UgU3RvcmFnZQpTb2xvIGVzdGEgY3VlbnRhIHB1ZWRlIG1pbnRlYXIgdG9rZW5zAAAAAAAABUFkbWluAAAAAAAAAAAAAEdOb21icmUgZGVsIHRva2VuIC0gSW5zdGFuY2UgU3RvcmFnZQpFamVtcGxvOiAiQnVlbiBEw61hIEJ1aWxkZXJzIFRva2VuIgAAAAAJVG9rZW5OYW1lAAAAAAAAAAAAAFlTw61tYm9sbyBkZWwgdG9rZW4gLSBJbnN0YW5jZSBTdG9yYWdlCkVqZW1wbG86ICJCREIiLCAiVVNEQyIsIGV0YyAobcOheGltbyAzMiBjYXJhY3RlcmVzKQAAAAAAAAtUb2tlblN5bWJvbAAAAAAAAAAAVk7Dum1lcm8gZGUgZGVjaW1hbGVzIC0gSW5zdGFuY2UgU3RvcmFnZQpUw61waWNhbWVudGUgNyBwYXJhIFN0ZWxsYXIgKGFsaW5lYWRvIGNvbiBYTE0pAAAAAAAIRGVjaW1hbHMAAAAAAAAAX0ZsYWcgcGFyYSB2ZXJpZmljYXIgaW5pY2lhbGl6YWNpw7NuIC0gSW5zdGFuY2UgU3RvcmFnZQpQcmV2aWVuZSByZS1pbmljaWFsaXphY2nDs24gZGVsIGNvbnRyYXRvAAAAAAtJbml0aWFsaXplZAA=",
        "AAAAAQAAAG1NZXRhZGF0YSBzdHJ1Y3QgcGFyYSBhbG1hY2VuYXIgaW5mb3JtYWNpw7NuIGRlbCB0b2tlbgpVc2FkbyBlbiBpbml0aWFsaXplKCkgcGFyYSBwYXNhciBtw7psdGlwbGVzIHBhcsOhbWV0cm9zAAAAAAAAAAAAAA1Ub2tlbk1ldGFkYXRhAAAAAAAAAwAAAAAAAAAIZGVjaW1hbHMAAAAEAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQ",
        "AAAABAAAAKxFbnVtIGRlIGVycm9yZXMgcGVyc29uYWxpemFkb3MgcGFyYSBlbCB0b2tlbgoKQ2FkYSBlcnJvciB0aWVuZSB1biBjw7NkaWdvIMO6bmljbyBwYXJhIGRlYnVnZ2luZyBlbiBlbCBsZWRnZXIKTG9zIGPDs2RpZ29zIGVtcGllemFuIGVuIDEgKDAgZXN0w6EgcmVzZXJ2YWRvIHBhcmEgInNpbiBlcnJvciIpAAAAAAAAAApUb2tlbkVycm9yAAAAAAAJAAAAVEVsIGNvbnRyYXRvIHlhIGZ1ZSBpbmljaWFsaXphZG8KU2UgbGFuemEgc2kgc2UgaW50ZW50YSBsbGFtYXIgaW5pdGlhbGl6ZSgpIGRvcyB2ZWNlcwAAABJBbHJlYWR5SW5pdGlhbGl6ZWQAAAAAAAEAAABHQW1vdW50IGRlYmUgc2VyIG1heW9yIGEgMApUcmFuc2ZlcmVuY2lhcywgbWludCwgYnVybiwgZXRjLiBubyBhY2VwdGFuIDAAAAAADUludmFsaWRBbW91bnQAAAAAAAACAAAATkJhbGFuY2UgaW5zdWZpY2llbnRlIHBhcmEgbGEgb3BlcmFjacOzbgpFbCB1c3VhcmlvIG5vIHRpZW5lIHN1ZmljaWVudGVzIHRva2VucwAAAAAAE0luc3VmZmljaWVudEJhbGFuY2UAAAAAAwAAAFBBbGxvd2FuY2UgaW5zdWZpY2llbnRlIHBhcmEgdHJhbnNmZXJfZnJvbQpFbCBzcGVuZGVyIG5vIHRpZW5lIHBlcm1pc28gc3VmaWNpZW50ZQAAABVJbnN1ZmZpY2llbnRBbGxvd2FuY2UAAAAAAAAEAAAAWEVsIGNvbnRyYXRvIG5vIGhhIHNpZG8gaW5pY2lhbGl6YWRvClRvZGFzIGxhcyBvcGVyYWNpb25lcyByZXF1aWVyZW4gaW5pdGlhbGl6ZSgpIHByaW1lcm8AAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAUAAABNRGVjaW1hbGVzIGludsOhbGlkb3MgKG3DoXhpbW8gMTgpClBvciBjb252ZW5jacOzbiwgU3RlbGxhciB1c2EgNywgRXRoZXJldW0gMTgAAAAAAAAPSW52YWxpZERlY2ltYWxzAAAAAAYAAABMT3ZlcmZsb3cgZW4gb3BlcmFjacOzbiBhcml0bcOpdGljYQpjaGVja2VkX2FkZC9jaGVja2VkX3N1YiBkZXRlY3TDsyBvdmVyZmxvdwAAAA1PdmVyZmxvd0Vycm9yAAAAAAAABwAAAEhUcmFuc2ZlcmVuY2lhIGEgc8OtIG1pc21vIG5vIHBlcm1pdGlkYQpmcm9tID09IHRvIChvcHRpbWl6YWNpw7NuIGRlIGdhcykAAAAQSW52YWxpZFJlY2lwaWVudAAAAAgAAABZTm9tYnJlIG8gc8OtbWJvbG8gaW52w6FsaWRvICh2YWPDrW8gbyBtdXkgbGFyZ28pClZhbGlkYWNpw7NuIGRlIG1ldGFkYXRvcyBlbiBpbml0aWFsaXplKCkAAAAAAAAPSW52YWxpZE1ldGFkYXRhAAAAAAk=",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAABAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQAAAAAAAAAAhkZWNpbWFscwAAAAQAAAABAAAD6QAAA+0AAAAAAAAH0AAAAApUb2tlbkVycm9yAAA=",
        "AAAAAAAAAAAAAAAEbWludAAAAAIAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAApUb2tlbkVycm9yAAA=",
        "AAAAAAAAAAAAAAAEYnVybgAAAAIAAAAAAAAABGZyb20AAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAApUb2tlbkVycm9yAAA=",
        "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAPpAAAD7QAAAAAAAAfQAAAAClRva2VuRXJyb3IAAA==",
        "AAAAAAAAAAAAAAAHYXBwcm92ZQAAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAAHc3BlbmRlcgAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAApUb2tlbkVycm9yAAA=",
        "AAAAAAAAAAAAAAAJYWxsb3dhbmNlAAAAAAAAAgAAAAAAAAAEZnJvbQAAABMAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAAAAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAABAAAD6QAAA+0AAAAAAAAH0AAAAApUb2tlbkVycm9yAAA=",
        "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
        "AAAAAAAAAAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
        "AAAAAAAAAAAAAAAIZGVjaW1hbHMAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAMdG90YWxfc3VwcGx5AAAAAAAAAAEAAAAL",
        "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAABM=" ]),
      options
    )
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<Result<void>>,
        mint: this.txFromJSON<Result<void>>,
        burn: this.txFromJSON<Result<void>>,
        balance: this.txFromJSON<i128>,
        transfer: this.txFromJSON<Result<void>>,
        approve: this.txFromJSON<Result<void>>,
        allowance: this.txFromJSON<i128>,
        transfer_from: this.txFromJSON<Result<void>>,
        name: this.txFromJSON<string>,
        symbol: this.txFromJSON<string>,
        decimals: this.txFromJSON<u32>,
        total_supply: this.txFromJSON<i128>,
        admin: this.txFromJSON<string>
  }
}