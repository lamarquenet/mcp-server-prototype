#!/usr/bin/env node

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { createEmailMessage } from "./utils/mail.js";
import { getOAuth2Client, loadCredentials } from "../utils/auth.js";

export const SendEmailSchema = z.object({
  to: z.array(z.string()).describe("List of recipient email addresses"),
  subject: z.string().describe("Email subject"),
  body: z.string().describe("Email body content"),
  cc: z.array(z.string()).optional().describe("List of CC recipients"),
  bcc: z.array(z.string()).optional().describe("List of BCC recipients"),
  threadId: z.string().optional().describe("Thread ID to reply to"),
  inReplyTo: z.string().optional().describe("Message ID being replied to"),
});

export type SendEmail= z.infer<typeof SendEmailSchema>;

/**
 * draft email tool definition
 */
export const sendEmailTool = {
  name: "send_email",
  description: "Sends a new email",
  inputSchema: zodToJsonSchema(SendEmailSchema),
  handler: async (input: SendEmail, extra: { authInfo: AuthInfo }) => {
    const args = SendEmailSchema.parse(input);
    try {
        const message = createEmailMessage(input);

        await loadCredentials();
        const oauth2Client = getOAuth2Client();
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        const encodedMessage = Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        // Define the type for messageRequest
        interface GmailMessageRequest {
            raw: string;
            threadId?: string;
        }

        const messageRequest: GmailMessageRequest = {
            raw: encodedMessage,
        };

        // Add threadId if specified
        if (args.threadId) {
            messageRequest.threadId = args.threadId;
        }

        const response = await gmail.users.messages.send({
            userId: "me",
            requestBody: messageRequest,
        });

        return {
            type: "text",
            content: `Email sent successfully with ID: ${response.data.id}`,
        };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};