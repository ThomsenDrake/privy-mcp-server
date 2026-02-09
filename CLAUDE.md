# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server for Privy's authentication and wallet management APIs. It exposes 50+ Privy API operations as MCP tools that can be used by Claude Desktop, Claude Code, and other MCP-compatible clients.

## Development Commands

### Build & Development
```bash
# Build TypeScript to JavaScript
npm run build

# Watch mode for development
npm run dev

# Start the MCP server
npm start

# Test with MCP Inspector tool
npm run inspector
```

### Environment Setup
```bash
# Copy and configure environment variables
cp .env.example .env
```

Required environment variables:
- `PRIVY_APP_ID` - Your Privy app ID
- `PRIVY_APP_SECRET` - Your Privy app secret  
- `PRIVY_API_BASE_URL` - Privy API base URL (default: https://api.privy.io/v1)
- `PRIVY_AUTHORIZATION_PRIVATE_KEY` - Optional, for operations requiring authorization signatures

## Architecture

### Core Components

**`src/index.ts` - MCP Server & Privy Client**
- Contains the main `PrivyClient` class that handles all Privy API interactions
- Implements authorization signature generation for sensitive operations (key quorums, policies, wallet RPC)
- Uses `canonicalizeJson()` method for RFC 8785 JSON canonicalization
- Sets up MCP server with stdio transport
- Entry point that validates environment and starts the server

**`src/tools.ts` - Tool Definitions**
- Exports `getAllTools()` which returns all 50+ tool definitions
- Each tool has name, description, and inputSchema
- Tool categories: wallet management, user management, policies, key quorums, transactions

**`src/handlers.ts` - Tool Execution**  
- Exports `handleToolCall()` which routes tool requests to appropriate Privy API methods
- Maps tool names to PrivyClient methods
- Validates parameters using Zod schemas before execution

**`src/schemas.ts` - Validation Schemas**
- Contains Zod schemas for all tool parameters
- Ensures type safety for API calls
- Includes schemas for complex operations like policies and key quorums

### Authorization Signature Flow

Some Privy operations require authorization signatures. The flow in `index.ts`:

1. `requiresAuthorizationSignature()` checks if operation needs signing
2. `generateAuthorizationSignature()` creates signature:
   - Builds payload with version, method, URL, body, headers
   - Canonicalizes JSON payload using RFC 8785
   - Signs with ECDSA using the authorization private key
   - Returns base64-encoded DER signature
3. Signature added to request as `privy-authorization-signature` header

Operations requiring signatures:
- Key quorum updates/deletions (PATCH/DELETE `/key_quorums/*`)
- Policy modifications (PATCH/DELETE `/policies/*`)
- Wallet RPC operations (POST `/wallets/*/rpc`)

### MCP Protocol Implementation

The server follows the MCP protocol:
- Handles `ListToolsRequest` to return available tools
- Handles `CallToolRequest` to execute tools
- Uses stdio transport for communication with Claude
- Returns JSON-RPC formatted responses

## Adding New Tools

To add a new Privy API operation:

1. **Add tool definition in `src/tools.ts`**:
```typescript
{
  name: "tool_name",
  description: "What this tool does",
  inputSchema: {
    type: "object",
    properties: {
      // Define parameters
    },
    required: ["required_params"]
  }
}
```

2. **Add Zod schema in `src/schemas.ts`**:
```typescript
export const ToolNameParamsSchema = z.object({
  // Define validation
});
```

3. **Add handler case in `src/handlers.ts`**:
```typescript
case "tool_name": {
  const params = ToolNameParamsSchema.parse(args);
  const result = await privyClient.methodName(params);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
}
```

4. **Add method to PrivyClient in `src/index.ts`** if needed

## TypeScript Configuration

The project uses strict TypeScript settings with:
- Target: ES2020
- Module: NodeNext (for proper ESM support)
- All strict checks enabled
- Source maps and declarations generated
- Unused locals/parameters flagged as errors

## Testing & Debugging

### MCP Inspector
```bash
npm run inspector
# Opens interactive tool to test MCP server implementation
```

### Manual Testing
```bash
# Build and run directly
npm run build && npm start

# Check tool discovery
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node build/src/index.js
```

### Common Issues

**Authorization Signature Failures**
- Check `PRIVY_AUTHORIZATION_PRIVATE_KEY` is set correctly
- Verify it's in proper format (base64 or PEM)
- Debug output written to `/tmp/privy-debug.txt`

**Environment Variables Not Loading**
- Ensure `.env` file exists in project root
- Check that `dotenv.config()` is called before accessing env vars

**TypeScript Build Errors**
- Run `npm run build` to see detailed errors
- Check that all imports use `.js` extension for ESM compatibility