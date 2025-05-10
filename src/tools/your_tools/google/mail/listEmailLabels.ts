import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { loadCredentials, getOAuth2Client } from "./utils/auth.js";

export const ListEmailLabelsSchema = z.object({}).describe("Retrieves all available Gmail labels");

export type ListEmailLabels = z.infer<typeof ListEmailLabelsSchema>;

/**
 * list email labels tool definition
 */
export const listEmailLabelsTool = {
  name: "list_email_labels",
  description: "Retrieves all available Gmail labels",
  inputSchema: zodToJsonSchema(ListEmailLabelsSchema),
  handler: async (_input: ListEmailLabels, extra: { authInfo: AuthInfo }) => {
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const response = await gmail.users.labels.list({ userId: "me" });
      const labels = response.data.labels || [];

      return {
        content: labels.map((label) => `ID: ${label.id}\nName: ${label.name}\n`).join("\n"),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
