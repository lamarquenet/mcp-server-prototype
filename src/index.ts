#!/usr/bin/env node
import express, { NextFunction, Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CONFIG, env } from "./common/settings.js";
import { setupTools } from "./tools/index.js";
import { auth } from "./middlewares/auth.js";
import { authenticate, loadCredentials } from "./tools/your_tools/google/mail/utils/auth.js";
import { Context } from "./types/global.js";
import { StreamableHTTPServerTransport  } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { randomUUID } from "node:crypto"

async function main() {
  // 1) Handle your existing “auth” shortcut
  if (process.argv[2] === 'auth') {
    await loadCredentials();
    await authenticate();
    process.stderr.write('Authentication completed successfully\n');
    process.exit(0);
  }

  // 2) Decide which transport-mode we’re in
  //    You can set USE_STDIO=true in your env, or pass “stdio” as an arg, etc.
  const useStdIO =
    process.argv.includes('stdio') ||
    process.env.USE_STDIO === 'true';

  // 3) Create the MCP server (same in both cases)
  const server = new Server(
    { name: CONFIG.NAME, version: CONFIG.VERSION },
    {
      capabilities: { tools: {} },
      instructions:
        "This is a Model Context Protocol server for connecting with your mail APIS.",
    }
  );
  setupTools(server);

  if (useStdIO) {
    // —— STDIO MODE —————————————————————————————————————————————
    // connect the stdio transport, then exit (process stays alive on stdio streams)
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
  } else {
    // —— SSE MODE ——————————————————————————————————————————————
    process.stderr.write('🌐 Starting in SSE/streameable mode; mounting /SSE /MCP endpoints\n');
    
    const app = express();
    app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        credentials: false,
        exposedHeaders: ["Mcp-Session-Id"],
      })
    );
    // Store transports for each session type
    const transports: {
      [sessionId: string]: {
        transport: SSEServerTransport;
        context: Context;
      };
    } = {};
    const transportStreameable: { [sessionId: string]: StreamableHTTPServerTransport } = {};

    // Modern Streamable HTTP endpoint
    app.post('/mcp', auth, async (req, res) => {
      app.use(express.json());
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      process.stderr.write(`🌐 mcp session id ${sessionId}\n`);
      let transport: StreamableHTTPServerTransport;
      process.stderr.write(`req.body ${req.body}\n`);
      process.stderr.write(`initializerequest ${isInitializeRequest(req.body)}\n`);

      try {
        if (sessionId && transportStreameable[sessionId]) {
          // Reuse existing transport
          process.stderr.write('Reuse existing transport\n');
          transport = transportStreameable[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request
          process.stderr.write('🌐 New initialization request\n');
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              // Store the transport by session ID
              transportStreameable[sessionId] = transport;
            }
          });
          process.stderr.write(` transport: ${transport}\n`);
          // Clean up transport when closed
          transport.onclose = () => {
            if (transport.sessionId) {
              delete transportStreameable[transport.sessionId];
            }
          };
          // Connect to the MCP server
          await server.connect(transport);
        } else {
          process.stderr.write('no valid session request\n');
          // Invalid request
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }

        // Handle the request
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        process.stderr.write(`Error parsing request body: ${error}\n`);
      }
    });

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (req: express.Request, res: express.Response) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      process.stderr.write(`handleSessionrequest ${sessionId} \n`);
      if (!sessionId || !transportStreameable[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }
      
      const transport = transportStreameable[sessionId];
      await transport.handleRequest(req, res);
    };

    // Handle GET requests for server-to-client notifications via SSE
    app.get('/mcp', handleSessionRequest);

    // Handle DELETE requests for session termination
    app.delete('/mcp', handleSessionRequest);

    // SSE “handshake” endpoint
    app.get("/sse", auth, async (req: Request, res: Response) => {
      try {
        // === Transport detection ===
        const queryParam = req.query.transportType as string | undefined;
        const acceptHeader = req.headers["accept"];
        const transportType =
          queryParam === "sse" || acceptHeader?.includes("text/event-stream")
            ? "sse"
            : "streamable";
        
        process.stderr.write(`🔌 Selected transport: ${transportType}\n`);
        process.stderr.write(`🔌 Selected acceptHeader: ${acceptHeader}\n`);
        process.stderr.write(`🔌 Selected req.query.transportType: ${req.query.transportType}\n`);

        // 2) Now create and connect the transport
        const transport = new SSEServerTransport("/messages", res);
        process.stderr.write(`SSE connection Handshake with seesionId ${transport.sessionId}\n`);
        transports[transport.sessionId] = {
          transport,
          context: {
            authInfo: {
              token: (req as any)?.auth?.token ?? "your-private-token"
            },
          },
        };
        res.on("close", () => {
          process.stderr.write(`❌ SSE connection closed for session ${transport.sessionId}\n`);
          delete transports[transport.sessionId];
        });
        await server.connect(transport);
      } catch (err) {
        console.error("Error in SSE connection:", err);
        if (!res.headersSent) res.status(500).json({ error: String(err) });
      }
    });

    // SSE “message” endpoint
    app.post("/messages", auth, async (req, res) => {
      try {
        const sessionId = req.query.sessionId as string;
        process.stderr.write(`Session messages ${sessionId}\n`);
        const session = transports[sessionId];
        if (!session) throw new Error(`No session ${sessionId}`);
        (req as any).auth = {
          token: session?.context?.authInfo?.token ?? "your-private-token"
        };
        await session.transport.handlePostMessage(req, res);
      } catch (err) {
        console.error("Error handling SSE message:", err);
        if (!res.headersSent) res.status(500).json({ error: String(err) });
      }
    });

    // start HTTP server
    app.listen(env.PORT, () => {
      process.stderr.write(`🚀 SSE - Mcp server listening on port ${env.PORT}\n`);
    });
  }

  // Global error handlers:
  process.on("uncaughtException", (err) =>
    console.error("Unhandled Exception:", err)
  );
  process.on("unhandledRejection", (reason) =>
    console.error("Unhandled Rejection:", reason)
  );
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

