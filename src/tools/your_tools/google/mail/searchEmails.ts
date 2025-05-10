import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { getOAuth2Client, loadCredentials } from "./utils/auth.js";

export const SearchEmailsSchema = z.object({
  query: z.string().describe("Gmail search query (e.g., 'from:example@gmail.com')"),
  maxResults: z.number().optional().describe("Maximum number of results to return"),
});

export type SearchEmails = z.infer<typeof SearchEmailsSchema>;

/**
 * search emails tool definition
 */
export const searchEmailsTool = {
  name: "search_emails",
  description: "Searches for emails them using Gmail search syntax and lists the results",
  inputSchema: zodToJsonSchema(SearchEmailsSchema),
  handler: async (input: SearchEmails, extra: { authInfo: AuthInfo }) => {
    const args = SearchEmailsSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const response = await gmail.users.messages.list({
        userId: "me",
        q: args.query,
        maxResults: args.maxResults || 10,
      });

      const messages: { id?: string | null }[] = response.data.messages || [];
      const results: { id: string; subject: string; from: string; date: string }[] = await Promise.all(
        messages.map(async (msg: { id?: string | null }) => {
          if (!msg.id) {
            throw new Error("Message ID is undefined");
          }
          const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });
          const headers: { name: string; value?: string }[] = (detail.data.payload?.headers || [])
            .filter((h): h is { name: string; value?: string | null } => h.name !== undefined && h.name !== null)
            .map(h => ({ name: h.name, value: h.value ?? undefined }));
          return {
            id: msg.id,
            subject: headers.find((h: { name: string; value?: string }) => h.name === "Subject")?.value || "",
            from: headers.find((h) => h.name === "From")?.value || "",
            date: headers.find((h) => h.name === "Date")?.value || "",
          };
        })
      );

      return {
        type: "text",
        text: results.map(r =>
            `ID: ${r.id}\nSubject: ${r.subject}\nFrom: ${r.from}\nDate: ${r.date}\n`
        ).join('\n'),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
