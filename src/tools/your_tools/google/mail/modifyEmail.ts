import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";

export const ModifyEmailSchema = z.object({
  messageId: z.string().describe("ID of the email message to modify"),
  labelIds: z.array(z.string()).optional().describe("List of label IDs to apply"),
  addLabelIds: z.array(z.string()).optional().describe("List of label IDs to add to the message"),
  removeLabelIds: z.array(z.string()).optional().describe("List of label IDs to remove from the message"),
});

export type ModifyEmail = z.infer<typeof ModifyEmailSchema>;

/**
 * modify email tool definition
 */
export const modifyEmailTool = {
  name: "modify_email",
  description: "Modifies email labels (move to different folders)",
  inputSchema: zodToJsonSchema(ModifyEmailSchema),
  handler: async (input: ModifyEmail, extra: { authInfo: AuthInfo }) => {
    const args = ModifyEmailSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const requestBody: any = {};
      if (args.labelIds) requestBody.labelIds = args.labelIds;
      if (args.addLabelIds) requestBody.addLabelIds = args.addLabelIds;
      if (args.removeLabelIds) requestBody.removeLabelIds = args.removeLabelIds;

      await gmail.users.messages.modify({
        userId: "me",
        id: args.messageId,
        requestBody,
      });

      return {
        content: `Email ${args.messageId} labels updated successfully`,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
