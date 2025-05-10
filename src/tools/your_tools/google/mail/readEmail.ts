import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { getOAuth2Client, loadCredentials } from "./utils/auth.js";

// Type definitions for Gmail API responses
interface GmailMessagePart {
    partId?: string;
    mimeType?: string;
    filename?: string;
    headers?: Array<{
        name: string;
        value: string;
    }>;
    body?: {
        attachmentId?: string;
        size?: number;
        data?: string;
    };
    parts?: GmailMessagePart[];
}

interface EmailAttachment {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
}

interface EmailContent {
    text: string;
    html: string;
}

/**
 * Recursively extract email body content from MIME message parts
 * Handles complex email structures with nested parts
 */
function extractEmailContent(messagePart: GmailMessagePart): EmailContent {
    // Initialize containers for different content types
    let textContent = '';
    let htmlContent = '';

    // If the part has a body with data, process it based on MIME type
    if (messagePart.body && messagePart.body.data) {
        const content = Buffer.from(messagePart.body.data, 'base64').toString('utf8');

        // Store content based on its MIME type
        if (messagePart.mimeType === 'text/plain') {
            textContent = content;
        } else if (messagePart.mimeType === 'text/html') {
            htmlContent = content;
        }
    }

    // If the part has nested parts, recursively process them
    if (messagePart.parts && messagePart.parts.length > 0) {
        for (const part of messagePart.parts) {
            const { text, html } = extractEmailContent(part);
            if (text) textContent += text;
            if (html) htmlContent += html;
        }
    }

    // Return both plain text and HTML content
    return { text: textContent, html: htmlContent };
}

export const ReadEmailSchema = z.object({
  messageId: z.string().describe("ID of the email message to retrieve"),
});

export type ReadEmail = z.infer<typeof ReadEmailSchema>;

/**
 * read email tool definition
 */
export const readEmailTool = {
  name: "read_email",
  description: "Retrieves the content of a specific email",
  inputSchema: zodToJsonSchema(ReadEmailSchema),
  handler: async (input: ReadEmail, extra: { authInfo: AuthInfo }) => {
    const args = ReadEmailSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const response = await gmail.users.messages.get({
        userId: "me",
        id: args.messageId,
        format: "full",
      });

      const headers: { name?: string | null; value?: string | null }[] = response.data.payload?.headers || [];
      const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "";
      const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
      const to = headers.find((h) => h.name?.toLowerCase() === "to")?.value || "";
      const date = headers.find((h) => h.name?.toLowerCase() === "date")?.value || "";
      const threadId = response.data.threadId || '';

      // Extract email content using the recursive function
      const { text, html } = extractEmailContent(response.data.payload as GmailMessagePart || {});

      // Use plain text content if available, otherwise use HTML content
      // (optionally, you could implement HTML-to-text conversion here)
      let body = text || html || '';

      // If we only have HTML content, add a note for the user
      const contentTypeNote = !text && html ?
          '[Note: This email is HTML-formatted. Plain text version not available.]\n\n' : '';

      // Get attachment information
      const attachments: EmailAttachment[] = [];
      const processAttachmentParts = (part: GmailMessagePart, path: string = '') => {
          if (part.body && part.body.attachmentId) {
              const filename = part.filename || `attachment-${part.body.attachmentId}`;
              attachments.push({
                  id: part.body.attachmentId,
                  filename: filename,
                  mimeType: part.mimeType || 'application/octet-stream',
                  size: part.body.size || 0
              });
          }

          if (part.parts) {
              part.parts.forEach((subpart: GmailMessagePart) =>
                  processAttachmentParts(subpart, `${path}/parts`)
              );
          }
      };

      if (response.data.payload) {
          processAttachmentParts(response.data.payload as GmailMessagePart);
      }

      // Add attachment info to output if any are present
      const attachmentInfo = attachments.length > 0 ?
          `\n\nAttachments (${attachments.length}):\n` +
          attachments.map(a => `- ${a.filename} (${a.mimeType}, ${Math.round(a.size/1024)} KB)`).join('\n') : '';

      return {
          content: [
              {
                  type: "text",
                  text: `Thread ID: ${threadId}\nSubject: ${subject}\nFrom: ${from}\nTo: ${to}\nDate: ${date}\n\n${contentTypeNote}${body}${attachmentInfo}`,
              },
          ],
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
