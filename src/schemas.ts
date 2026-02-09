import { z } from "zod";

// ============================================================================
// WALLET SCHEMAS
// ============================================================================

export const GetWalletsParamsSchema = z.object({
  chain_type: z.string().optional().describe("Filter by chain type (ethereum, solana, etc.)"),
  limit: z.number().optional().default(10).describe("Number of wallets to return (default: 10)")
});

export const GetWalletDetailsParamsSchema = z.object({
  walletId: z.string().describe("The wallet ID to retrieve")
});

export const CreateWalletParamsSchema = z.object({
  chain_type: z.enum(['solana', 'ethereum', 'cosmos', 'stellar', 'sui'])
    .default('ethereum')
    .describe("Chain type of the wallet. 'ethereum' supports any EVM-compatible network."),
  policy_ids: z.array(z.string())
    .max(1)
    .optional()
    .describe("Optional policy ID to enforce on the wallet (max 1)")
});

export const UpdateWalletParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to update."),
  policyIds: z.array(z.string()).max(1).optional().describe("The new policy ID to enforce on the wallet (max 1)")
});

export const GetWalletBalanceParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to check balance for."),
  asset: z.enum(["usdc", "eth"]).describe("Asset type (usdc or eth)"),
  chain: z.enum(["ethereum", "arbitrum", "base", "linea", "optimism", "zksync_era"]).describe("Blockchain network"),
  includeCurrency: z.enum(["usd"]).optional().describe("Include pricing in specified currency")
});

export const GetWalletTransactionsParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to get transactions for."),
  chain: z.enum(["base"]).describe("Blockchain network"),
  asset: z.enum(["usdc", "eth"]).describe("Asset type (usdc or eth)"),
  cursor: z.string().optional().describe("Pagination cursor for the next set of results."),
  limit: z.number().int().max(100).optional().describe("Maximum number of transactions to return (max 100).")
});

// ============================================================================
// SIGNING SCHEMAS
// ============================================================================

export const PersonalSignParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for signing."),
  message: z.string().describe("Message to sign"),
  encoding: z.enum(["utf-8", "hex"]).optional().default("utf-8").describe("Message encoding (utf-8 or hex)")
});

export const EthSignTransactionParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for signing."),
  transaction: z.object({
    from: z.string().optional().describe("Sender address"),
    to: z.string().describe("Recipient address"),
    chain_id: z.union([z.string(), z.number()]).describe("Chain ID as string or number"),
    nonce: z.union([z.string(), z.number()]).describe("Transaction nonce as string or number"),
    data: z.string().optional().default("0x").describe("Transaction data as hex string"),
    value: z.string().optional().describe("Value to send in wei as hex string"),
    type: z.number().optional().describe("Transaction type (0, 1, or 2)"),
    gas_limit: z.union([z.string(), z.number()]).describe("Gas limit as string or number"),
    gas_price: z.union([z.string(), z.number()]).optional().describe("Gas price as string or number"),
    max_fee_per_gas: z.union([z.string(), z.number()]).optional().describe("Max fee per gas as string or number"),
    max_priority_fee_per_gas: z.union([z.string(), z.number()]).optional().describe("Max priority fee per gas as string or number")
  }).describe("Ethereum transaction object")
});

export const EthSignTypedDataV4ParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for signing."),
  typed_data: z.object({
    types: z.record(z.string(), z.array(z.object({
      name: z.string(),
      type: z.string()
    }))).describe("The type definitions used in the structured data"),
    domain: z.record(z.string(), z.any()).describe("Domain separator data"),
    message: z.record(z.string(), z.any()).describe("The message to be signed"),
    primary_type: z.string().describe("The primary type to use for signing")
  }).describe("EIP-712 typed data object")
});

export const Secp256k1SignParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for signing."),
  hash: z.string().describe("The hash to sign")
});

export const EthSendTransactionParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for transaction."),
  caip2: z.string().describe("Blockchain identifier in CAIP-2 format (e.g. eip155:1 for Ethereum mainnet)"),
  chain_type: z.enum(["ethereum"]).default("ethereum").describe("Chain type (currently only ethereum is supported)"),
  transaction: z.object({
    to: z.string().describe("Recipient address"),
    value: z.string().optional().describe("Value to send in wei as hex string"),
    data: z.string().optional().default("0x").describe("Transaction data as hex string"),
    from: z.string().optional().describe("Sender address, usually inferred from the wallet"),
    chain_id: z.union([z.string(), z.number()]).optional().describe("Chain ID, usually inferred from caip2"),
    nonce: z.union([z.string(), z.number()]).optional().describe("Transaction nonce"),
    type: z.number().optional().describe("Transaction type (0, 1, or 2)"),
    gas_limit: z.union([z.string(), z.number()]).optional().describe("Gas limit"),
    gas_price: z.union([z.string(), z.number()]).optional().describe("Gas price")
  }).describe("Ethereum transaction object"),
  sponsor: z.boolean().optional().default(false).describe("Enable gas sponsorship for this transaction")
});

export const SolanaSignMessageParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for signing."),
  message: z.string().describe("Message to sign"),
  encoding: z.enum(["utf-8", "base64", "hex"]).default("base64").describe("Message encoding")
});

export const SolanaSignTransactionParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for signing."),
  transaction: z.string().describe("Base64 encoded serialized transaction to sign"),
  encoding: z.enum(["base64"]).default("base64").describe("Transaction encoding")
});

export const SolanaSignAndSendTransactionParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for signing and sending."),
  transaction: z.string().describe("Base64 encoded serialized transaction to sign and send"),
  encoding: z.enum(["base64"]).default("base64").describe("Transaction encoding"),
  caip2: z.enum([
    "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", // Mainnet
    "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", // Devnet
    "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z"  // Testnet
  ]).describe("Solana network identifier in CAIP-2 format"),
  sponsor: z.boolean().optional().default(false).describe("Enable gas sponsorship for this transaction")
});

export const RawSignParamsSchema = z.object({
  walletId: z.string().describe("ID of the wallet to use for signing."),
  hash: z.string().describe("Hash to sign using the blockchain's cryptographic curve")
});

// ============================================================================
// POLICY CONSTANTS
// ============================================================================

export const POLICY_SUPPORTED_METHODS = [
  "eth_sendTransaction",
  "eth_signTransaction",
  "eth_signTypedData_v4",
  "signTransaction",
  "signAndSendTransaction",
  "exportPrivateKey",
  "*"
] as const;

export const POLICY_FIELD_SOURCES = [
  "ethereum_transaction",
  "ethereum_calldata",
  "ethereum_typed_data_domain",
  "ethereum_typed_data_message",
  "solana_program_instruction",
  "solana_system_program_instruction",
  "solana_token_program_instruction"
] as const;

export const FIELD_SOURCE_FIELDS = {
  ethereum_transaction: ["to", "value"] as const,
  ethereum_calldata: [] as const,
  ethereum_typed_data_domain: ["chainId", "verifyingContract"] as const,
  ethereum_typed_data_message: [] as const,
  solana_program_instruction: [] as const,
  solana_system_program_instruction: [] as const,
  solana_token_program_instruction: [] as const
};

export const POLICY_OPERATORS = ["eq", "gt", "gte", "lt", "lte", "in"] as const;

export const POLICY_ACTIONS = ["ALLOW", "DENY"] as const;

// ============================================================================
// POLICY SCHEMAS
// ============================================================================

export const AbiSchema = z.any();

export const PolicyConditionSchema = z.discriminatedUnion('field_source', [
  z.object({
    field_source: z.literal('ethereum_transaction'),
    field: z.enum(FIELD_SOURCE_FIELDS.ethereum_transaction),
    operator: z.enum(POLICY_OPERATORS),
    value: z.union([z.string(), z.number(), z.array(z.string())])
  }),
  z.object({
    field_source: z.literal('ethereum_calldata'),
    field: z.string(),
    abi: AbiSchema.optional(),
    operator: z.enum(POLICY_OPERATORS),
    value: z.union([z.string(), z.number(), z.array(z.string())])
  }),
  z.object({
    field_source: z.literal('ethereum_typed_data_domain'),
    field: z.enum(FIELD_SOURCE_FIELDS.ethereum_typed_data_domain),
    operator: z.enum(POLICY_OPERATORS),
    value: z.union([z.string(), z.number(), z.array(z.string())])
  }),
  z.object({
    field_source: z.literal('ethereum_typed_data_message'),
    field: z.string(),
    operator: z.enum(POLICY_OPERATORS),
    value: z.union([z.string(), z.number(), z.array(z.string())])
  }),
  z.object({
    field_source: z.enum([
      'solana_program_instruction',
      'solana_system_program_instruction',
      'solana_token_program_instruction'
    ]),
    field: z.string(),
    operator: z.enum(POLICY_OPERATORS),
    value: z.union([z.string(), z.number(), z.array(z.string())])
  })
]).refine((data) => {
  if (data.operator === 'in' && !Array.isArray(data.value)) return false;
  if (data.operator !== 'in' && Array.isArray(data.value)) return false;
  return true;
}, {
  message: "The 'in' operator requires an array value, other operators require scalar values"
});

export const PolicyRuleSchema = z.object({
  name: z.string().max(50).min(1),
  method: z.enum(POLICY_SUPPORTED_METHODS),
  conditions: z.array(PolicyConditionSchema),
  action: z.enum(POLICY_ACTIONS)
});

export const AddRuleToPolicyParamsSchema = z.object({
  policy_id: z.string().length(24, { message: "Policy ID must be exactly 24 characters" }),
  name: z.string().max(50).min(1),
  method: z.enum(POLICY_SUPPORTED_METHODS),
  conditions: z.array(PolicyConditionSchema).optional().default([]),
  action: z.enum(POLICY_ACTIONS)
});

export const CreatePolicyParamsSchema = z.object({
  version: z.enum(["1.0"]).default("1.0"),
  name: z.string().max(50).min(1),
  chain_type: z.enum(["ethereum"]),
  rules: z.array(PolicyRuleSchema).min(1)
});

export const GetPolicyParamsSchema = z.object({
  policy_id: z.string().length(24, { message: "Policy ID must be exactly 24 characters" })
});

export const UpdatePolicyParamsSchema = z.object({
  policy_id: z.string().length(24, { message: "Policy ID must be exactly 24 characters" }),
  name: z.string().max(50).optional(),
  rules: z.array(PolicyRuleSchema).optional()
});

export const DeletePolicyParamsSchema = z.object({
  policy_id: z.string().length(24, { message: "Policy ID must be exactly 24 characters" })
});

export const GetPolicyRuleParamsSchema = z.object({
  policy_id: z.string().length(24, { message: "Policy ID must be exactly 24 characters" }),
  rule_id: z.string().min(1, { message: "Rule ID is required" })
});

export const UpdatePolicyRuleParamsSchema = z.object({
  policy_id: z.string().length(24, { message: "Policy ID must be exactly 24 characters" }),
  rule_id: z.string().min(1, { message: "Rule ID is required" }),
  name: z.string().max(50).min(1),
  method: z.enum(POLICY_SUPPORTED_METHODS),
  conditions: z.array(PolicyConditionSchema),
  action: z.enum(POLICY_ACTIONS)
});

export const DeletePolicyRuleParamsSchema = z.object({
  policy_id: z.string().length(24, { message: "Policy ID must be exactly 24 characters" }),
  rule_id: z.string().min(1, { message: "Rule ID is required" })
});

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const GetTransactionParamsSchema = z.object({
  transaction_id: z.string().min(1, { message: "Transaction ID is required" })
});
