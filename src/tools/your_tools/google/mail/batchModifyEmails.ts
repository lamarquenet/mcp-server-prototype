import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";

export const BatchModifyEmailsSchema = z.object({
  messageIds: z.array(z.string()).describe("List of message IDs to modify"),
  addLabelIds: z.array(z.string()).optional().describe("List of label IDs to add to all messages"),
  removeLabelIds: z.array(z.string()).optional().describe("List of label IDs to remove from all messages"),
  batchSize: z.number().optional().default(50).describe("Number of messages to process in each batch (default: 50)"),
});

export type BatchModifyEmails = z.infer<typeof BatchModifyEmailsSchema>;

/**
 * batch modify emails tool definition
 */
export const batchModifyEmailsTool = {
  name: "batch_modify_emails",
  description: "Modifies labels for multiple emails in batches",
  inputSchema: zodToJsonSchema(BatchModifyEmailsSchema),
  handler: async (input: BatchModifyEmails, extra: { authInfo: AuthInfo }) => {
    const args = BatchModifyEmailsSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const { messageIds, addLabelIds, removeLabelIds, batchSize } = args;
      const requestBody: any = {};
      if (addLabelIds) requestBody.addLabelIds = addLabelIds;
      if (removeLabelIds) requestBody.removeLabelIds = removeLabelIds;

      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map((messageId) =>
            gmail.users.messages.modify({
              userId: "me",
              id: messageId,
              requestBody,
            })
          )
        );
      }

      return {
        content: `Batch modification completed for ${messageIds.length} messages.`,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
