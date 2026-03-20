# Privy MCP Server

[![npm version](https://img.shields.io/npm/v/@privy-io/mcp-server.svg)](https://www.npmjs.com/package/@privy-io/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Give your AI agent a wallet with [Privy](https://privy.io). This MCP (Model Context Protocol) server enables Claude and other AI assistants to create wallets, sign transactions, and manage blockchain operations.

## Installation

### Option 1: npx (Recommended)

Run directly without installation:

```bash
npx @privy-io/mcp-server
```

### Option 2: Global Install

```bash
npm install -g @privy-io/mcp-server
privy-mcp-server
```

### Option 3: From Source

```bash
git clone https://github.com/privy-io/privy-mcp-server.git
cd privy-mcp-server
npm install && npm run build
```

## Quick Start

### 1. Get Your Credentials

From the [Privy Dashboard](https://dashboard.privy.io):
- **App ID & Secret**: Settings → Basics

### 2. Configure Your MCP Client

Add to your MCP client configuration:

<details>
<summary><b>Claude Desktop</b> (~/.config/claude/claude_desktop_config.json)</summary>

```json
{
  "mcpServers": {
    "privy": {
      "command": "npx",
      "args": ["@privy-io/mcp-server"],
      "env": {
        "PRIVY_APP_ID": "your-app-id",
        "PRIVY_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```
</details>

<details>
<summary><b>Cursor</b> (~/.cursor/mcp.json)</summary>

```json
{
  "mcpServers": {
    "privy": {
      "command": "npx",
      "args": ["@privy-io/mcp-server"],
      "env": {
        "PRIVY_APP_ID": "your-app-id",
        "PRIVY_APP_SECRET": "your-app-secret"
      }
    }
  }
}
```
</details>

<details>
<summary><b>Claude Code</b> (project .mcp.json)</summary>

```json
{
  "privy": {
    "command": "npx",
    "args": ["@privy-io/mcp-server"],
    "env": {
      "PRIVY_APP_ID": "your-app-id",
      "PRIVY_APP_SECRET": "your-app-secret"
    }
  }
}
```
</details>

### 3. Start Using!

Ask Claude to create a wallet:
> "Create an Ethereum wallet for me"

## Supported Chains

| Chain | Type | Status |
|-------|------|--------|
| Ethereum (+ all EVM) | `ethereum` | ✅ Full support |
| Solana | `solana` | ✅ Full support |
| Cosmos | `cosmos` | ✅ Supported |
| Stellar | `stellar` | ✅ Supported |
| Sui | `sui` | ✅ Supported |
| Aptos | `aptos` | ✅ Supported |
| Tron | `tron` | ✅ Supported |
| Bitcoin (SegWit) | `bitcoin-segwit` | ✅ Supported |
| Near | `near` | ✅ Supported |
| TON | `ton` | ✅ Supported |
| Starknet | `starknet` | ✅ Supported |

## Available Tools

### Wallet Management
| Tool | Description |
|------|-------------|
| `create_wallet` | Create a new wallet on any supported chain |
| `get_wallet_details` | Get wallet info by ID |
| `get_wallets` | List all wallets |
| `get_wallet_balance` | Check balance (ETH, USDC, etc.) |
| `get_wallet_transactions` | Get transaction history |
| `update_wallet` | Update wallet policies |

### Ethereum Operations
| Tool | Description |
|------|-------------|
| `eth_sendTransaction` | Sign and broadcast (supports gas sponsorship) |
| `personal_sign` | Sign a message (EIP-191) |
| `eth_signTransaction` | Sign without broadcasting |
| `eth_signTypedData_v4` | Sign EIP-712 typed data |
| `secp256k1_sign` | Sign a hash directly |
| `raw_sign` | Sign raw data |

### Solana Operations
| Tool | Description |
|------|-------------|
| `solana_signAndSendTransaction` | Sign and broadcast |
| `solana_signMessage` | Sign a message |
| `solana_signTransaction` | Sign without broadcasting |

### Policies (Access Control)
| Tool | Description |
|------|-------------|
| `create_policy` | Create transaction policies |
| `get_policy` / `update_policy` / `delete_policy` | Manage policies |
| `add_rule_to_policy` | Add rules to control transactions |
| `get_policy_rule` / `update_policy_rule` / `delete_policy_rule` | Manage rules |

### Key Quorums (Multi-sig)
| Tool | Description |
|------|-------------|
| `create_key_quorum` | Create a key quorum for multi-sig |
| `get_key_quorum` / `update_key_quorum` / `delete_key_quorum` | Manage quorums |

### Transactions
| Tool | Description |
|------|-------------|
| `get_transaction` | Get transaction details by ID |

## Example Conversations

```
You: Create a wallet and check its balance

Claude: I'll create an Ethereum wallet and check the balance.
🔧 create_wallet → { id: "wallet-abc", address: "0x742d35Cc..." }
🔧 get_wallet_balance → { balance: "0 ETH" }

Done! Your wallet 0x742d35Cc... has been created with 0 ETH.
```

```
You: Send 0.01 ETH to 0x123... on Base

Claude: I'll send 0.01 ETH to that address on Base.
🔧 eth_sendTransaction → { hash: "0xabc123...", status: "pending" }

Transaction submitted! Hash: 0xabc123...
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVY_APP_ID` | Yes | Your Privy App ID |
| `PRIVY_APP_SECRET` | Yes | Your Privy App Secret |
| `PRIVY_AUTHORIZATION_PRIVATE_KEY` | No | For signing ops on owner-controlled wallets |
| `PRIVY_API_BASE_URL` | No | Custom API URL (default: https://api.privy.io/v1) |
| `MCP_AUTH_TOKEN` | No | Bearer token for authenticating JSON-RPC messages (see below) |

## Testing

Use the MCP Inspector to test tools interactively:

```bash
npm run inspector
```

## Bearer Token Authentication

When deploying the MCP server remotely (e.g. Railway, Fly.io), you can require bearer token authentication on all incoming JSON-RPC messages by setting `MCP_AUTH_TOKEN`:

```bash
MCP_AUTH_TOKEN=your_secret_token
```

When set, every JSON-RPC message must include an `auth` field:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1,
  "auth": "Bearer your_secret_token"
}
```

Messages with a missing or invalid token receive a `-32600` error response. When `MCP_AUTH_TOKEN` is not set, authentication is disabled and the server accepts all messages (the default for local usage).

## Security Best Practices

- **Never commit credentials** - Use environment variables
- **Use bearer token auth** when deploying remotely by setting `MCP_AUTH_TOKEN`
- **Use policies** to restrict what transactions your agent can execute
- **Set up key quorums** for high-value operations requiring multiple approvals
- **Monitor transactions** via Privy Dashboard webhooks

## Resources

- [Privy Documentation](https://docs.privy.io)
- [Agentic Wallets Guide](https://docs.privy.io/recipes/wallets/agentic-wallets)
- [Privy Dashboard](https://dashboard.privy.io)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs to the `main` branch.

## License

MIT - see [LICENSE](LICENSE) for details.
