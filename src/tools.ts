
/**
 * Returns all tool definitions for the server
 */
export function getAllTools() {
  return [
    // ============================================================================
    // WALLET TOOLS
    // ============================================================================
    {
      name: "get_wallets",
      description: "Retrieves a list of wallets associated with the Privy application.",
      inputSchema: {
        type: "object",
        properties: {
          chain_type: {
            type: "string",
            description: "Filter by chain type (ethereum, solana, etc.)",
          },
          limit: {
            type: "number",
            description: "Number of wallets to return (default: 10)",
            default: 10,
          },
        },
        required: [],
      },
    },
    {
      name: "get_wallet_details",
      description: "Retrieves details for a specific wallet by its ID.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: {
            type: "string",
            description: "The wallet ID to retrieve",
          },
        },
        required: ["walletId"],
      },
    },
    {
      name: "create_wallet",
      description: "Creates a new app-owned wallet. App-owned wallets are fully managed by your Privy app.",
      inputSchema: {
        type: "object",
        properties: {
          chain_type: {
            type: "string",
            description: "The chain type of the wallet to create",
            enum: ["ethereum", "solana", "cosmos", "stellar", "sui"],
            default: "ethereum",
          },
          policy_ids: {
            type: "array",
            items: { type: "string" },
            maxItems: 1,
            description: "Optional policy ID to enforce on the wallet (max 1)"
          }
        },
        required: [],
      },
    },
    {
      name: "update_wallet",
      description: "Updates a wallet's policies.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: { 
            type: "string", 
            description: "ID of the wallet to update." 
          },
          policyIds: {
            type: "array",
            items: { type: "string" },
            maxItems: 1,
            description: "The new policy ID to enforce on the wallet (max 1)"
          }
        },
        required: ["walletId"]
      }
    },
    {
      name: "get_wallet_balance",
      description: "Retrieves the balance of a wallet for a specific asset and chain.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: {
            type: "string", 
            description: "ID of the wallet to check balance for."
          },
          asset: {
            type: "string",
            description: "Asset type (usdc or eth)",
            enum: ["usdc", "eth"]
          },
          chain: {
            type: "string",
            description: "Blockchain network",
            enum: ["ethereum", "arbitrum", "base", "linea", "optimism", "zksync_era"]
          },
          includeCurrency: {
            type: "string",
            description: "Include pricing in specified currency",
            enum: ["usd"]
          }
        },
        required: ["walletId", "asset", "chain"]
      },
    },
    {
      name: "get_wallet_transactions",
      description: "Retrieves transaction history for a specific wallet.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: {
            type: "string", 
            description: "ID of the wallet to get transactions for."
          },
          chain: {
            type: "string",
            description: "Blockchain network",
            enum: ["base"]
          },
          asset: {
            type: "string",
            description: "Asset type (usdc or eth)",
            enum: ["usdc", "eth"]
          },
          cursor: {
            type: "string",
            description: "Pagination cursor for the next set of results."
          },
          limit: {
            type: "integer",
            description: "Maximum number of transactions to return (max 100).",
            maximum: 100
          }
        },
        required: ["walletId", "chain", "asset"]
      },
    },

    // ============================================================================
    // SIGNING TOOLS
    // ============================================================================
    {
      name: "personal_sign",
      description: "Sign a message using the personal_sign method with a specified wallet.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: {
            type: "string", 
            description: "ID of the wallet to use for signing."
          },
          message: {
            type: "string",
            description: "Message to sign"
          },
          encoding: {
            type: "string",
            description: "Message encoding (utf-8 or hex)",
            enum: ["utf-8", "hex"],
            default: "utf-8"
          }
        },
        required: ["walletId", "message"]
      },
    },
    {
      name: "eth_signTransaction",
      description: "Sign a transaction using the eth_signTransaction method with a specified wallet.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: {
            type: "string",
            description: "ID of the wallet to use for signing."
          },
          transaction: {
            type: "object",
            description: "Ethereum transaction object",
            properties: {
              from: { type: "string", description: "Sender address" },
              to: { type: "string", description: "Recipient address" },
              chain_id: { type: ["string", "number"], description: "Chain ID" },
              nonce: { type: ["string", "number"], description: "Transaction nonce" },
              data: { type: "string", description: "Transaction data as hex string", default: "0x" },
              value: { type: "string", description: "Value to send in wei as hex string" },
              type: { type: "number", description: "Transaction type (0, 1, or 2)", enum: [0, 1, 2] },
              gas_limit: { type: ["string", "number"], description: "Gas limit" },
              gas_price: { type: ["string", "number"], description: "Gas price" },
              max_fee_per_gas: { type: ["string", "number"], description: "Max fee per gas" },
              max_priority_fee_per_gas: { type: ["string", "number"], description: "Max priority fee per gas" }
            },
            required: ["to", "chain_id", "nonce", "gas_limit"]
          }
        },
        required: ["walletId", "transaction"]
      },
    },
    {
      name: "eth_signTypedData_v4",
      description: "Sign EIP-712 typed data using eth_signTypedData_v4 method.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: {
            type: "string",
            description: "ID of the wallet to use for signing."
          },
          typed_data: {
            type: "object",
            description: "EIP-712 typed data object",
            properties: {
              types: { type: "object", description: "Type definitions" },
              domain: { type: "object", description: "Domain separator data" },
              message: { type: "object", description: "The message to be signed" },
              primary_type: { type: "string", description: "The primary type to use for signing" }
            },
            required: ["types", "domain", "message", "primary_type"]
          }
        },
        required: ["walletId", "typed_data"]
      },
    },
    {
      name: "secp256k1_sign",
      description: "Sign a hash using the secp256k1 method.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: { type: "string", description: "ID of the wallet to use for signing." },
          hash: { type: "string", description: "The hash to sign (e.g. 0x12345678)" }
        },
        required: ["walletId", "hash"]
      },
    },
    {
      name: "raw_sign",
      description: "Sign a raw hash using the wallet's private key along the blockchain's cryptographic curve.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: { type: "string", description: "ID of the wallet to use for signing." },
          hash: { type: "string", description: "Hash to sign (e.g. 0x0775aeed9c9ce6e0fbc4db25c5e4e6368029651c905c286f813126a09025a21e)" }
        },
        required: ["walletId", "hash"]
      },
    },

    // ============================================================================
    // ETHEREUM TRANSACTION TOOLS
    // ============================================================================
    {
      name: "eth_sendTransaction",
      description: "Sign and broadcast a transaction to the blockchain network.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: { type: "string", description: "ID of the wallet to use for the transaction." },
          caip2: { type: "string", description: "Blockchain identifier in CAIP-2 format (e.g. eip155:1 for Ethereum mainnet, eip155:8453 for Base)" },
          chain_type: { type: "string", description: "Chain type", enum: ["ethereum"], default: "ethereum" },
          transaction: {
            type: "object",
            description: "Ethereum transaction object",
            properties: {
              to: { type: "string", description: "Recipient address" },
              value: { type: "string", description: "Value to send in wei as hex string (e.g. 0x2386F26FC10000 for 0.01 ETH)" },
              data: { type: "string", description: "Transaction data as hex string", default: "0x" },
              gas_limit: { type: ["string", "number"], description: "Gas limit" }
            },
            required: ["to"]
          },
          sponsor: { type: "boolean", description: "Enable gas sponsorship (requires Privy Dashboard config)", default: false }
        },
        required: ["walletId", "caip2", "transaction"]
      },
    },

    // ============================================================================
    // SOLANA TOOLS
    // ============================================================================
    {
      name: "solana_signMessage",
      description: "Sign a message with a Solana wallet.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: { type: "string", description: "ID of the wallet to use for signing." },
          message: { type: "string", description: "Message to sign" },
          encoding: { type: "string", description: "Message encoding", enum: ["utf-8", "base64", "hex"], default: "base64" }
        },
        required: ["walletId", "message"]
      },
    },
    {
      name: "solana_signTransaction",
      description: "Sign a transaction with a Solana wallet without broadcasting it.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: { type: "string", description: "ID of the wallet to use for signing." },
          transaction: { type: "string", description: "Base64 encoded serialized transaction to sign" },
          encoding: { type: "string", description: "Transaction encoding", enum: ["base64"], default: "base64" }
        },
        required: ["walletId", "transaction"]
      },
    },
    {
      name: "solana_signAndSendTransaction",
      description: "Sign and broadcast a transaction with a Solana wallet.",
      inputSchema: {
        type: "object",
        properties: {
          walletId: { type: "string", description: "ID of the wallet to use for signing and sending." },
          transaction: { type: "string", description: "Base64 encoded serialized transaction to sign and send" },
          encoding: { type: "string", description: "Transaction encoding", enum: ["base64"], default: "base64" },
          caip2: {
            type: "string",
            description: "Solana network identifier in CAIP-2 format",
            enum: [
              "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", // Mainnet
              "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", // Devnet
              "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z"  // Testnet
            ]
          },
          sponsor: { type: "boolean", description: "Enable gas sponsorship (requires Privy Dashboard config)", default: false }
        },
        required: ["walletId", "transaction", "caip2"]
      },
    },

    // ============================================================================
    // POLICY TOOLS
    // ============================================================================
    {
      name: "create_policy",
      description: "Create a new wallet policy with rules governing transaction behavior.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name for the policy (max 50 characters)", maxLength: 50 },
          chain_type: { type: "string", description: "Chain type (currently only ethereum)", enum: ["ethereum"] },
          rules: {
            type: "array",
            description: "Rules that define policy behavior",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Name of the rule (max 50 characters)" },
                method: { type: "string", description: "Method the rule applies to", enum: ["eth_sendTransaction", "eth_signTransaction", "eth_signTypedData_v4", "signTransaction", "signAndSendTransaction", "exportPrivateKey", "*"] },
                conditions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field_source: { type: "string", enum: ["ethereum_transaction"] },
                      field: { type: "string", enum: ["to", "value"] },
                      operator: { type: "string", enum: ["eq", "gt", "gte", "lt", "lte", "in"] },
                      value: { description: "Value to compare against" }
                    },
                    required: ["field_source", "field", "operator", "value"]
                  }
                },
                action: { type: "string", enum: ["ALLOW", "DENY"] }
              },
              required: ["name", "method", "conditions", "action"]
            }
          }
        },
        required: ["name", "chain_type", "rules"]
      },
    },
    {
      name: "get_policy",
      description: "Retrieves a policy by its ID.",
      inputSchema: {
        type: "object",
        properties: {
          policy_id: { type: "string", description: "ID of the policy to retrieve (24 characters)" }
        },
        required: ["policy_id"]
      }
    },
    {
      name: "update_policy",
      description: "Updates an existing policy by its ID.",
      inputSchema: {
        type: "object",
        properties: {
          policy_id: { type: "string", description: "ID of the policy to update (24 characters)" },
          name: { type: "string", description: "New name for the policy (1-50 characters)" },
          rules: { type: "array", description: "Updated rules for the policy" }
        },
        required: ["policy_id"]
      }
    },
    {
      name: "delete_policy",
      description: "Deletes a policy by its ID.",
      inputSchema: {
        type: "object",
        properties: {
          policy_id: { type: "string", description: "ID of the policy to delete (24 characters)" }
        },
        required: ["policy_id"]
      }
    },
    {
      name: "add_rule_to_policy",
      description: "Adds a new rule to an existing policy.",
      inputSchema: {
        type: "object",
        properties: {
          policy_id: { type: "string", description: "ID of the policy (24 characters)" },
          name: { type: "string", description: "Name for the rule (1-50 characters)" },
          method: { type: "string", enum: ["eth_sendTransaction", "eth_signTransaction", "eth_signTypedData_v4", "signTransaction", "signAndSendTransaction", "exportPrivateKey", "*"] },
          conditions: { type: "array", description: "Conditions that define when the rule applies" },
          action: { type: "string", enum: ["ALLOW", "DENY"] }
        },
        required: ["policy_id", "name", "method", "conditions", "action"]
      }
    },
    {
      name: "get_policy_rule",
      description: "Retrieves a specific rule from a policy.",
      inputSchema: {
        type: "object",
        properties: {
          policy_id: { type: "string", description: "ID of the policy (24 characters)" },
          rule_id: { type: "string", description: "ID of the rule to retrieve" }
        },
        required: ["policy_id", "rule_id"]
      }
    },
    {
      name: "update_policy_rule",
      description: "Updates an existing rule within a policy.",
      inputSchema: {
        type: "object",
        properties: {
          policy_id: { type: "string", description: "ID of the policy (24 characters)" },
          rule_id: { type: "string", description: "ID of the rule to update" },
          name: { type: "string", description: "Name for the rule (1-50 characters)" },
          method: { type: "string", enum: ["eth_sendTransaction", "eth_signTransaction", "eth_signTypedData_v4", "signTransaction", "signAndSendTransaction", "exportPrivateKey", "*"] },
          conditions: { type: "array", description: "Conditions that define when the rule applies" },
          action: { type: "string", enum: ["ALLOW", "DENY"] }
        },
        required: ["policy_id", "rule_id", "name", "method", "conditions", "action"]
      }
    },
    {
      name: "delete_policy_rule",
      description: "Deletes a specific rule from a policy.",
      inputSchema: {
        type: "object",
        properties: {
          policy_id: { type: "string", description: "ID of the policy (24 characters)" },
          rule_id: { type: "string", description: "ID of the rule to delete" }
        },
        required: ["policy_id", "rule_id"]
      }
    },

    // ============================================================================
    // TRANSACTION TOOLS
    // ============================================================================
    {
      name: "get_transaction",
      description: "Retrieves transaction details by transaction ID.",
      inputSchema: {
        type: "object",
        properties: {
          transaction_id: { type: "string", description: "ID of the transaction to retrieve" }
        },
        required: ["transaction_id"]
      }
    },
  ];
}
