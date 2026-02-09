import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as readline from "readline";
import { config } from "dotenv";

// Load environment variables
config();

// Types
interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

class PrivyAgent {
  private anthropic: Anthropic;
  private mcpClient: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Anthropic.Tool[] = [];
  private conversationHistory: Message[] = [];

  constructor() {
    this.anthropic = new Anthropic();
    this.mcpClient = new Client(
      { name: "privy-agent", version: "1.0.0" },
      { capabilities: {} }
    );
  }

  async connect(): Promise<void> {
    console.log("🔌 Connecting to Privy MCP Server...");

    // Start the MCP server as a subprocess
    this.transport = new StdioClientTransport({
      command: "node",
      args: ["../build/src/index.js"],
      env: {
        ...process.env,
        PRIVY_APP_ID: process.env.PRIVY_APP_ID!,
        PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET!,
        PRIVY_AUTHORIZATION_PRIVATE_KEY: process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY || "",
      },
    });

    await this.mcpClient.connect(this.transport);

    // Fetch available tools from MCP server
    const toolsResponse = await this.mcpClient.listTools();
    this.tools = toolsResponse.tools.map((tool: MCPTool) => ({
      name: tool.name,
      description: tool.description || "",
      input_schema: {
        type: tool.inputSchema.type as "object",
        properties: tool.inputSchema.properties || {},
        required: tool.inputSchema.required || [],
      },
    }));

    console.log(`✅ Connected! ${this.tools.length} tools available:`);
    console.log(this.tools.map(t => `   • ${t.name}`).join("\n"));
    console.log("");
  }

  async processQuery(userMessage: string): Promise<string> {
    this.conversationHistory.push({ role: "user", content: userMessage });

    const systemPrompt = `You are a helpful AI assistant with access to Privy wallet tools. You can:
- Create and manage cryptocurrency wallets (Ethereum, Solana, and other chains)
- Check wallet balances and transaction history
- Sign messages and transactions
- Manage wallet policies for security
- Work with key quorums for multi-sig setups

When users ask about wallets or crypto operations, use the available tools to help them.
Be concise but informative. If an operation could cost money or be irreversible, warn the user first.

Current capabilities: ${this.tools.map(t => t.name).join(", ")}`;

    let response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: this.tools,
      messages: this.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Agentic loop - keep processing until no more tool calls
    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        console.log(`\n🔧 Calling tool: ${toolUse.name}`);
        console.log(`   Input: ${JSON.stringify(toolUse.input, null, 2)}`);

        try {
          const result = await this.mcpClient.callTool({
            name: toolUse.name,
            arguments: toolUse.input as Record<string, unknown>,
          });

          const resultText = result.content
            .filter((c): c is { type: "text"; text: string } => c.type === "text")
            .map((c) => c.text)
            .join("\n");

          console.log(`   ✅ Result: ${resultText.substring(0, 200)}${resultText.length > 200 ? "..." : ""}`);

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: resultText,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.log(`   ❌ Error: ${errorMessage}`);
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Error: ${errorMessage}`,
            is_error: true,
          });
        }
      }

      // Continue the conversation with tool results
      response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools: this.tools,
        messages: [
          ...this.conversationHistory.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          { role: "assistant", content: response.content },
          { role: "user", content: toolResults },
        ],
      });
    }

    // Extract final text response
    const finalResponse = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    this.conversationHistory.push({ role: "assistant", content: finalResponse });

    return finalResponse;
  }

  async chatLoop(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("🤖 Privy Agent Ready! Type your message (or 'quit' to exit)\n");

    const prompt = (): void => {
      rl.question("You: ", async (input) => {
        const userInput = input.trim();

        if (userInput.toLowerCase() === "quit" || userInput.toLowerCase() === "exit") {
          console.log("👋 Goodbye!");
          rl.close();
          await this.disconnect();
          process.exit(0);
        }

        if (!userInput) {
          prompt();
          return;
        }

        try {
          const response = await this.processQuery(userInput);
          console.log(`\nAssistant: ${response}\n`);
        } catch (error) {
          console.error("Error:", error instanceof Error ? error.message : error);
        }

        prompt();
      });
    };

    prompt();
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.mcpClient.close();
    }
  }
}

// Main
async function main(): Promise<void> {
  // Validate environment
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY is required. Set it in .env file.");
    process.exit(1);
  }
  if (!process.env.PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
    console.error("❌ PRIVY_APP_ID and PRIVY_APP_SECRET are required. Set them in .env file.");
    process.exit(1);
  }

  const agent = new PrivyAgent();

  try {
    await agent.connect();
    await agent.chatLoop();
  } catch (error) {
    console.error("Fatal error:", error);
    await agent.disconnect();
    process.exit(1);
  }
}

main();
