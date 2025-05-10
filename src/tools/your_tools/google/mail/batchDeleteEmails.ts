import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { loadCredentials, getOAuth2Client } from "./utils/auth.js";

export const BatchDeleteEmailsSchema = z.object({
  messageIds: z.array(z.string()).describe("List of message IDs to delete"),
  batchSize: z.number().optional().default(50).describe("Number of messages to process in each batch (default: 50)"),
});

export type BatchDeleteEmails = z.infer<typeof BatchDeleteEmailsSchema>;

/**
 * batch delete emails tool definition
 */
export const batchDeleteEmailsTool = {
  name: "batch_delete_emails",
  description: "Permanently deletes multiple emails in batches",
  inputSchema: zodToJsonSchema(BatchDeleteEmailsSchema),
  handler: async (input: BatchDeleteEmails, extra: { authInfo: AuthInfo }) => {
    const args = BatchDeleteEmailsSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const { messageIds, batchSize } = args;

      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map((messageId) =>
            gmail.users.messages.delete({
              userId: "me",
              id: messageId,
            })
          )
        );
      }

      return {
        content: `Batch deletion completed for ${messageIds.length} messages.`,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
