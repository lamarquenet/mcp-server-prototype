import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { yourTools } from "./your_tools/index.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from "@modelcontextprotocol/sdk/types.js";

// agrege mas tools de acuerdo con su necesidad 
export const tools = new Map<string, any >([
  ...yourTools
]);

/**
 * Set up the tools for the MCP server
 * @param server - The MCP server instance
 */
export const setupTools = (server: Server): void => {
  // Register tool capabilities with the server
  // Note: We can't modify server.capabilities directly
  // The capabilities are set during server initialization

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Array.from(tools.entries()).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const tool = tools.get(request.params.name);
    if (!tool) {
      console.error(`Tool '${request.params.name}' not found`);
      throw new McpError(ErrorCode.MethodNotFound, `Tool '${request.params.name}' not found`);
    }

    try {
      const result = await (tool as any).handler(request.params.arguments, extra);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error("Error executing tool:", error);
      throw new McpError(ErrorCode.InternalError, error.message);
    }
  });
}