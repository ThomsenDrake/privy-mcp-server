import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { PrivyClient } from './index.js';
import {
  GetWalletsParamsSchema,
  GetWalletDetailsParamsSchema,
  CreateWalletParamsSchema,
  UpdateWalletParamsSchema,
  GetWalletBalanceParamsSchema,
  GetWalletTransactionsParamsSchema,
  PersonalSignParamsSchema,
  EthSignTransactionParamsSchema,
  EthSignTypedDataV4ParamsSchema,
  Secp256k1SignParamsSchema,
  EthSendTransactionParamsSchema,
  SolanaSignMessageParamsSchema,
  SolanaSignTransactionParamsSchema,
  SolanaSignAndSendTransactionParamsSchema,
  RawSignParamsSchema,
  CreatePolicyParamsSchema,
  GetPolicyParamsSchema,
  UpdatePolicyParamsSchema,
  DeletePolicyParamsSchema,
  AddRuleToPolicyParamsSchema,
  GetPolicyRuleParamsSchema,
  UpdatePolicyRuleParamsSchema,
  DeletePolicyRuleParamsSchema,
  GetTransactionParamsSchema,
} from './schemas.js';

/**
 * Handle tool calls by routing to appropriate handlers
 */
export async function handleToolCall(
  request: CallToolRequest, 
  privyClient: PrivyClient
) {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ============================================================================
      // WALLET HANDLERS
      // ============================================================================
      case "get_wallets": {
        const validatedArgs = GetWalletsParamsSchema.parse(args || {});
        const wallets = await privyClient.getWallets(validatedArgs.chain_type, validatedArgs.limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(wallets, null, 2),
            },
          ],
        };
      }

      case "get_wallet_details": {
        const validatedArgs = GetWalletDetailsParamsSchema.parse(args);
        const wallet = await privyClient.getWallet(validatedArgs.walletId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(wallet, null, 2),
            },
          ],
        };
      }

      case "create_wallet": {
        const validatedArgs = CreateWalletParamsSchema.parse(args || {});
        
        const payload: {
          chain_type: 'ethereum' | 'solana' | 'cosmos' | 'stellar' | 'sui',
          policy_ids?: string[]
        } = {
          chain_type: validatedArgs.chain_type
        };
        
        if (validatedArgs.policy_ids) {
          payload.policy_ids = validatedArgs.policy_ids;
        }
        
        const newWallet = await privyClient.createWallet(payload);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(newWallet, null, 2),
            },
          ],
        };
      }

      case "update_wallet": {
        const validatedArgs = UpdateWalletParamsSchema.parse(args);
        const payload: { policy_ids?: string[] } = {};
        if (validatedArgs.policyIds && validatedArgs.policyIds.length > 0) {
          payload.policy_ids = validatedArgs.policyIds;
        }
        const updatedWallet = await privyClient.updateWallet(validatedArgs.walletId, payload);
        return {
          content: [
            { type: "text", text: JSON.stringify(updatedWallet, null, 2) }
          ]
        };
      }

      case "get_wallet_balance": {
        const validatedArgs = GetWalletBalanceParamsSchema.parse(args);
        const params: { asset: string, chain: string, include_currency?: string } = {
          asset: validatedArgs.asset,
          chain: validatedArgs.chain
        };
        if (validatedArgs.includeCurrency) {
          params.include_currency = validatedArgs.includeCurrency;
        }
        const balance = await privyClient.getWalletBalance(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(balance, null, 2) }
          ]
        };
      }

      case "get_wallet_transactions": {
        const validatedArgs = GetWalletTransactionsParamsSchema.parse(args);
        const params: { chain: string, asset: string, cursor?: string, limit?: number } = {
          chain: validatedArgs.chain,
          asset: validatedArgs.asset
        };
        if (validatedArgs.cursor) {
          params.cursor = validatedArgs.cursor;
        }
        if (validatedArgs.limit) {
          params.limit = validatedArgs.limit;
        }
        const transactions = await privyClient.getWalletTransactions(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(transactions, null, 2) }
          ]
        };
      }

      // ============================================================================
      // SIGNING HANDLERS
      // ============================================================================
      case "personal_sign": {
        const validatedArgs = PersonalSignParamsSchema.parse(args);
        const params = {
          message: validatedArgs.message,
          encoding: validatedArgs.encoding
        };
        const signatureResponse = await privyClient.personalSign(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(signatureResponse, null, 2) }
          ]
        };
      }

      case "eth_signTransaction": {
        const validatedArgs = EthSignTransactionParamsSchema.parse(args);
        const params = {
          transaction: validatedArgs.transaction
        };
        const signatureResponse = await privyClient.ethSignTransaction(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(signatureResponse, null, 2) }
          ]
        };
      }

      case "eth_signTypedData_v4": {
        const validatedArgs = EthSignTypedDataV4ParamsSchema.parse(args);
        const params = {
          typed_data: validatedArgs.typed_data
        };
        const signatureResponse = await privyClient.ethSignTypedDataV4(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(signatureResponse, null, 2) }
          ]
        };
      }

      case "secp256k1_sign": {
        const validatedArgs = Secp256k1SignParamsSchema.parse(args);
        const params = {
          hash: validatedArgs.hash
        };
        const signatureResponse = await privyClient.secp256k1Sign(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(signatureResponse, null, 2) }
          ]
        };
      }

      case "eth_sendTransaction": {
        const validatedArgs = EthSendTransactionParamsSchema.parse(args);
        const params = {
          caip2: validatedArgs.caip2,
          chain_type: validatedArgs.chain_type,
          transaction: validatedArgs.transaction,
          sponsor: validatedArgs.sponsor
        };
        const txResponse = await privyClient.ethSendTransaction(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(txResponse, null, 2) }
          ]
        };
      }

      case "raw_sign": {
        const validatedArgs = RawSignParamsSchema.parse(args);
        const params = {
          hash: validatedArgs.hash
        };
        const signatureResponse = await privyClient.rawSign(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(signatureResponse, null, 2) }
          ]
        };
      }

      // ============================================================================
      // SOLANA HANDLERS
      // ============================================================================
      case "solana_signMessage": {
        const validatedArgs = SolanaSignMessageParamsSchema.parse(args);
        const params = {
          message: validatedArgs.message,
          encoding: validatedArgs.encoding
        };
        const signatureResponse = await privyClient.solanaSignMessage(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(signatureResponse, null, 2) }
          ]
        };
      }

      case "solana_signTransaction": {
        const validatedArgs = SolanaSignTransactionParamsSchema.parse(args);
        const params = {
          transaction: validatedArgs.transaction,
          encoding: validatedArgs.encoding
        };
        const signatureResponse = await privyClient.solanaSignTransaction(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(signatureResponse, null, 2) }
          ]
        };
      }

      case "solana_signAndSendTransaction": {
        const validatedArgs = SolanaSignAndSendTransactionParamsSchema.parse(args);
        const params = {
          transaction: validatedArgs.transaction,
          encoding: validatedArgs.encoding,
          caip2: validatedArgs.caip2,
          sponsor: validatedArgs.sponsor
        };
        const signatureResponse = await privyClient.solanaSignAndSendTransaction(validatedArgs.walletId, params);
        return {
          content: [
            { type: "text", text: JSON.stringify(signatureResponse, null, 2) }
          ]
        };
      }

      // ============================================================================
      // POLICY HANDLERS
      // ============================================================================
      case "create_policy": {
        const validatedArgs = CreatePolicyParamsSchema.parse(args);
        const policyResponse = await privyClient.createPolicy(validatedArgs);
        return {
          content: [
            { type: "text", text: JSON.stringify(policyResponse, null, 2) }
          ]
        };
      }

      case "get_policy": {
        const validatedArgs = GetPolicyParamsSchema.parse(args);
        const policyResponse = await privyClient.getPolicy(validatedArgs.policy_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(policyResponse, null, 2) }
          ]
        };
      }

      case "update_policy": {
        const validatedArgs = UpdatePolicyParamsSchema.parse(args);
        const { policy_id, ...updateParams } = validatedArgs;
        const policyResponse = await privyClient.updatePolicy(policy_id, updateParams);
        return {
          content: [
            { type: "text", text: JSON.stringify(policyResponse, null, 2) }
          ]
        };
      }

      case "delete_policy": {
        const validatedArgs = DeletePolicyParamsSchema.parse(args);
        const policyResponse = await privyClient.deletePolicy(validatedArgs.policy_id);
        return {
          content: [
            { type: "text", text: JSON.stringify(policyResponse, null, 2) }
          ]
        };
      }

      case "add_rule_to_policy": {
        const validatedArgs = AddRuleToPolicyParamsSchema.parse(args);
        const { policy_id, ...ruleDetails } = validatedArgs;
        const rule = await privyClient.addRuleToPolicy(policy_id, ruleDetails);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rule, null, 2),
            },
          ],
        };
      }
      
      case "get_policy_rule": {
        const validatedArgs = GetPolicyRuleParamsSchema.parse(args);
        const rule = await privyClient.getPolicyRule(validatedArgs.policy_id, validatedArgs.rule_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rule, null, 2),
            },
          ],
        };
      }
      
      case "update_policy_rule": {
        const validatedArgs = UpdatePolicyRuleParamsSchema.parse(args);
        const { policy_id, rule_id, ...ruleDetails } = validatedArgs;
        const rule = await privyClient.updatePolicyRule(policy_id, rule_id, ruleDetails);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rule, null, 2),
            },
          ],
        };
      }
      
      case "delete_policy_rule": {
        const validatedArgs = DeletePolicyRuleParamsSchema.parse(args);
        const result = await privyClient.deletePolicyRule(validatedArgs.policy_id, validatedArgs.rule_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
        
      // ============================================================================
      // TRANSACTION HANDLERS
      // ============================================================================
      case "get_transaction": {
        const validatedArgs = GetTransactionParamsSchema.parse(args);
        const transaction = await privyClient.getTransaction(validatedArgs.transaction_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(transaction, null, 2),
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}
