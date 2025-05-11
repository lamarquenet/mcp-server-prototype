#!/usr/bin/env node
import express, { NextFunction, Request, Response } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CONFIG, env } from "./common/settings.js";
import { setupTools } from "./tools/index.js";
import { auth } from "./middlewares/auth.js";
import { Context } from "./types/global.js";
import { authenticate, loadCredentials } from "./tools/your_tools/google/mail/utils/auth.js";

try {
  process.stderr.write('Debug: server.ts script execution started\n');

  if (process.argv[2] === 'auth') {
          await loadCredentials();
          await authenticate();
          process.stderr.write('Authentication completed successfully\n');
          process.exit(0);
  }


  // Crear el servidor MCP
  const server = new Server(
    {
      name: CONFIG.NAME,
      version: CONFIG.VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: "This is a Model Context Protocol server for connecting with your mail APIS.",
    }
  );

  // Configurar las herramientas
  setupTools(server);
  process.stderr.write('Tools are being registered...\n');

  const transports: {
    [sessionId: string]: {
      transport: SSEServerTransport;
      context: Context;
    };
  } = {};

  // Crear el servidor Express
  const app = express();
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  }));

  // Ruta para establecer la conexión SSE
  app.get("/sse", auth, async (req: Request, res: Response) => {
    try {
      process.stderr.write(['Debug: Received query parameters:', req.query].join(' ') + '\n');

      // Crear transporte SSE
      const transport = new SSEServerTransport('/messages', res);
      transports[transport.sessionId] = {
        transport,
        context: {
          authInfo: {
            token: (req as any)?.auth?.token ?? 'your-private-token',
            chatGptApiKey: process.env.CHAT_GPT_API_KEY ?? 'default-api-key',
          }
        }
      }
      res.on("close", () => {
        process.stderr.write(`SSE connection closed for session ${transport.sessionId}\n`);
        process.stderr.write(`Reason for closure: ${res.writableEnded ? 'Client closed connection' : 'Server closed connection'}\n`);
        console.trace('Connection closure stack trace');
        delete transports[transport.sessionId];
      });

      // Conectar el transporte al servidor
      await server.connect(transport);
      process.stderr.write(`SSE connection established ${transport.sessionId}\n`);
    } catch (error) {
      process.stderr.write(["Error in SSE connection:", String(error)].join(' ') + '\n');
      if (!res.headersSent) {
        res.status(500).json({ error: `Failed to establish SSE connection ${error}` });
      }
    }
  });

  // Ruta para manejar mensajes a través de SSE
  app.post("/messages", auth, async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string;
      process.stderr.write(`Session messages ${sessionId}\n`);
      const session = transports[sessionId];
      if (session) {
        process.stderr.write(`Handling SSE message for session ${sessionId}\n`);
        (req as any).auth = {
          token: session?.context?.authInfo?.token,
          chatGptApiKey: process.env.CHAT_GPT_API_KEY ?? 'default-api-key',
        };

        await session.transport.handlePostMessage(req, res);
      } else {
        throw new Error(`No transport found for session ${sessionId}`);
      }
    } catch (error) {
      process.stderr.write(["Error in SSE message handling:", String(error)].join(' ') + '\n');
      if (!res.headersSent) {
        res.status(500).json({ error: `Internal Server Error ${error}` });
      }
    }
  });

  // Iniciar el servidor en el puerto configurado
  app.listen(env.PORT, () => {
    process.stderr.write(`🚀 Server is running on http://0.0.0.0:${env.PORT}\n`);
  });

  process.on('uncaughtException', (err) => {
    process.stderr.write(['Unhandled Exception:', String(err)].join(' ') + '\n');
  });

  process.on('unhandledRejection', (reason, promise) => {
    process.stderr.write(['Unhandled Rejection:', String(reason)].join(' ') + '\n');
  });

} catch (error) {
  process.stderr.write(['Critical error during server startup:', String(error)].join(' ') + '\n');
}
