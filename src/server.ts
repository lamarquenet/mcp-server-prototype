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
  console.log('Debug: server.ts script execution started');

  await loadCredentials();
  if (process.argv[2] === 'auth') {
          await authenticate();
          console.log('Authentication completed successfully');
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
  console.log('Tools are being registered...');

  const transports: {
    [sessionId: string]: {
      transport: SSEServerTransport;
      context: Context;
    };
  } = {};

  // Crear el servidor Express
  const app = express();
  app.use(cors());

  // Ruta para establecer la conexión SSE
  app.get("/sse", auth, async (req: Request, res: Response) => {
    try {
      console.log('Debug: Received query parameters:', req.query);

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
        console.log(`SSE connection closed for session ${transport.sessionId}`);
        console.log(`Reason for closure: ${res.writableEnded ? 'Client closed connection' : 'Server closed connection'}`);
        console.trace('Connection closure stack trace');
        delete transports[transport.sessionId];
      });

      // Conectar el transporte al servidor
      await server.connect(transport);
      console.log(`SSE connection established ${transport.sessionId}`);
    } catch (error) {
      console.error("Error in SSE connection:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: `Failed to establish SSE connection ${error}` });
      }
    }
  });

  // Ruta para manejar mensajes a través de SSE
  app.post("/messages", auth, async (req: Request, res: Response) => {
    try {
      const sessionId = req.query.sessionId as string;
      console.log(`Session messages ${sessionId}`);
      const session = transports[sessionId];
      if (session) {
        console.log(`Handling SSE message for session ${sessionId}`);
        (req as any).auth = {
          token: session?.context?.authInfo?.token,
          chatGptApiKey: process.env.CHAT_GPT_API_KEY ?? 'default-api-key',
        };

        await session.transport.handlePostMessage(req, res);
      } else {
        throw new Error(`No transport found for session ${sessionId}`);
      }
    } catch (error) {
      console.error("Error in SSE message handling:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: `Internal Server Error ${error}` });
      }
    }
  });

  // Iniciar el servidor en el puerto configurado
  app.listen(env.PORT, () => {
    console.log(`🚀 Server is running on http://0.0.0.0:${env.PORT}`);
  });

  process.on('uncaughtException', (err) => {
    console.error('Unhandled Exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
  });

} catch (error) {
  console.error('Critical error during server startup:', error);
}
