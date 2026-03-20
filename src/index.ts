#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { Transform, type TransformCallback } from 'node:stream';
import dotenv from 'dotenv';
import { getAllTools } from './tools.js';
import { handleToolCall } from './handlers.js';
import { 
  AddRuleToPolicyParamsSchema,
  CreatePolicyParamsSchema,
  UpdatePolicyParamsSchema,
} from './schemas.js';

// Load environment variables
dotenv.config({ quiet: true });

const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

export class PrivyClient {
  private appId: string;
  private appSecret: string;
  private baseUrl: string;

  constructor() {
    this.appId = process.env.PRIVY_APP_ID || '';
    this.appSecret = process.env.PRIVY_APP_SECRET || '';
    this.baseUrl = process.env.PRIVY_API_BASE_URL || 'https://api.privy.io/v1';

    if (!this.appId || !this.appSecret) {
      throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET must be set in environment variables');
    }
  }

  private getHeaders(): Record<string, string> {
    const auth = Buffer.from(`${this.appId}:${this.appSecret}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'privy-app-id': this.appId,
      'Content-Type': 'application/json'
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      ...this.getHeaders(),
      ...(options.headers as Record<string, string> || {})
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Privy API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // ============================================================================
  // WALLET METHODS
  // ============================================================================
  
  async getWallets(chain_type?: string, limit: number = 10) {
    const params = new URLSearchParams();
    if (chain_type) params.append('chain_type', chain_type);
    params.append('limit', limit.toString());
    
    const endpoint = `/wallets?${params.toString()}`;
    return this.makeRequest(endpoint);
  }

  async getWallet(walletId: string) {
    return this.makeRequest(`/wallets/${walletId}`);
  }

  /**
   * Create a new app-owned wallet
   * App-owned wallets are managed by your Privy app and don't require authorization signatures.
   */
  async createWallet(payload: {
    chain_type: 'ethereum' | 'solana' | 'cosmos' | 'stellar' | 'sui',
    policy_ids?: string[]
  }) {
    return this.makeRequest('/wallets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async updateWallet(walletId: string, payload: { policy_ids?: string[] }) {
    return this.makeRequest(`/wallets/${walletId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getWalletBalance(walletId: string, params: { asset: string, chain: string, include_currency?: string }) {
    const queryParams = new URLSearchParams();
    queryParams.append('asset', params.asset);
    queryParams.append('chain', params.chain);
    if (params.include_currency) {
      queryParams.append('include_currency', params.include_currency);
    }
    
    return this.makeRequest(`/wallets/${walletId}/balance?${queryParams.toString()}`);
  }

  async getWalletTransactions(walletId: string, params: { chain: string, asset: string, cursor?: string, limit?: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('chain', params.chain);
    queryParams.append('asset', params.asset);
    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    return this.makeRequest(`/wallets/${walletId}/transactions?${queryParams.toString()}`);
  }

  // ============================================================================
  // WALLET RPC METHODS (Signing & Transactions)
  // ============================================================================

  async personalSign(walletId: string, params: { message: string, encoding: string }) {
    return this.makeRequest(`/wallets/${walletId}/rpc`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'personal_sign',
        params: {
          message: params.message,
          encoding: params.encoding
        }
      })
    });
  }

  async ethSignTransaction(walletId: string, params: { transaction: any }) {
    return this.makeRequest(`/wallets/${walletId}/rpc`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'eth_signTransaction',
        params: {
          transaction: params.transaction
        }
      })
    });
  }

  async ethSignTypedDataV4(walletId: string, params: { typed_data: any }) {
    return this.makeRequest(`/wallets/${walletId}/rpc`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'eth_signTypedData_v4',
        params: {
          typed_data: params.typed_data
        }
      })
    });
  }

  async secp256k1Sign(walletId: string, params: { hash: string }) {
    return this.makeRequest(`/wallets/${walletId}/rpc`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'secp256k1_sign',
        params: {
          hash: params.hash
        }
      })
    });
  }

  async ethSendTransaction(walletId: string, params: { caip2: string, chain_type: string, transaction: any, sponsor?: boolean }) {
    return this.makeRequest(`/wallets/${walletId}/rpc`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'eth_sendTransaction',
        caip2: params.caip2,
        chain_type: params.chain_type,
        params: {
          transaction: params.transaction
        },
        ...(params.sponsor && { sponsor: true })
      })
    });
  }

  async solanaSignMessage(walletId: string, params: { message: string, encoding: string }) {
    return this.makeRequest(`/wallets/${walletId}/rpc`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'signMessage',
        params: {
          message: params.message,
          encoding: params.encoding
        }
      })
    });
  }

  async solanaSignTransaction(walletId: string, params: { transaction: string, encoding: string }) {
    return this.makeRequest(`/wallets/${walletId}/rpc`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'signTransaction',
        params: {
          transaction: params.transaction,
          encoding: params.encoding
        }
      })
    });
  }

  async solanaSignAndSendTransaction(walletId: string, params: { transaction: string, encoding: string, caip2: string, sponsor?: boolean }) {
    return this.makeRequest(`/wallets/${walletId}/rpc`, {
      method: 'POST',
      body: JSON.stringify({
        method: 'signAndSendTransaction',
        caip2: params.caip2,
        params: {
          transaction: params.transaction,
          encoding: params.encoding
        },
        ...(params.sponsor && { sponsor: true })
      })
    });
  }

  async rawSign(walletId: string, params: { hash: string }) {
    return this.makeRequest(`/wallets/${walletId}/raw_sign`, {
      method: 'POST',
      body: JSON.stringify({
        params: {
          hash: params.hash
        }
      })
    });
  }

  // ============================================================================
  // POLICY METHODS
  // ============================================================================

  async createPolicy(params: z.infer<typeof CreatePolicyParamsSchema>) {
    return this.makeRequest('/policies', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async getPolicy(policy_id: string) {
    return this.makeRequest(`/policies/${policy_id}`);
  }
  
  async updatePolicy(policy_id: string, params: Omit<z.infer<typeof UpdatePolicyParamsSchema>, 'policy_id'>) {
    return this.makeRequest(`/policies/${policy_id}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  }
  
  async deletePolicy(policy_id: string) {
    return this.makeRequest(`/policies/${policy_id}`, {
      method: 'DELETE'
    });
  }
  
  async addRuleToPolicy(policy_id: string, params: Omit<z.infer<typeof AddRuleToPolicyParamsSchema>, 'policy_id'>) {
    return this.makeRequest(`/policies/${policy_id}/rules`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
  
  async getPolicyRule(policy_id: string, rule_id: string) {
    return this.makeRequest(`/policies/${policy_id}/rules/${rule_id}`);
  }
  
  async updatePolicyRule(policy_id: string, rule_id: string, params: {
    name: string;
    method: string;
    conditions: any[];
    action: 'ALLOW' | 'DENY';
  }) {
    return this.makeRequest(`/policies/${policy_id}/rules/${rule_id}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  }
  
  async deletePolicyRule(policy_id: string, rule_id: string) {
    return this.makeRequest(`/policies/${policy_id}/rules/${rule_id}`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // TRANSACTION METHODS
  // ============================================================================
  
  async getTransaction(transaction_id: string) {
    return this.makeRequest(`/transactions/${transaction_id}`);
  }
}

/**
 * Create and configure the MCP Server
 */
async function createPrivyMcpServer() {
  const server = new Server(
    {
      name: "privy-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const privyClient = new PrivyClient();

  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: getAllTools(),
    };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return handleToolCall(request, privyClient);
  });

  return server;
}

/**
 * Main function to start the MCP server
 */
async function main() {
  const privyAppId = process.env.PRIVY_APP_ID;
  const privyAppSecret = process.env.PRIVY_APP_SECRET;

  if (!privyAppId || !privyAppSecret) {
    console.error(
      "❌ Missing PRIVY_APP_ID or PRIVY_APP_SECRET in environment variables."
    );
    console.error("Please create a .env file based on .env.example and fill in your Privy credentials.");
    process.exit(1);
  }

  if (!MCP_AUTH_TOKEN) {
    console.error(
      "❌ Missing MCP_AUTH_TOKEN in environment variables."
    );
    console.error("Please set MCP_AUTH_TOKEN to secure your MCP server.");
    process.exit(1);
  }

  try {
    const server = await createPrivyMcpServer();

    const expectedAuth = `Bearer ${MCP_AUTH_TOKEN}`;
    let authBuffer = '';

    const authTransform = new Transform({
      transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
        authBuffer += chunk.toString();
        const lines = authBuffer.split('\n');
        authBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.replace(/\r$/, '');
          if (!trimmed) {
            callback();
            return;
          }

          try {
            const raw = JSON.parse(trimmed);
            const authHeader = raw.auth || raw.headers?.authorization;

            if (authHeader !== expectedAuth) {
              const errorResponse = JSON.stringify({
                jsonrpc: '2.0',
                id: raw.id ?? null,
                error: {
                  code: -32600,
                  message: 'Unauthorized: Invalid or missing bearer token'
                }
              }) + '\n';
              process.stdout.write(errorResponse);
              continue;
            }

            delete raw.auth;
            delete raw.headers;
            this.push(JSON.stringify(raw) + '\n');
          } catch {
            this.push(line + '\n');
          }
        }

        callback();
      }
    });

    const authedStdin = process.stdin.pipe(authTransform);
    const transport = new StdioServerTransport(authedStdin as any);
    await server.connect(transport);

    console.error("🚀 Privy MCP Server is running via stdio");

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
