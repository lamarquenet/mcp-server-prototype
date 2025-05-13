import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";

export const DeleteEmailSchema = z.object({
  messageId: z.string().describe("ID of the email message to delete"),
});

export type DeleteEmail = z.infer<typeof DeleteEmailSchema>;

/**
 * delete email tool definition
 */
export const deleteEmailTool = {
  name: "delete_email",
  description: "Permanently deletes an email",
  inputSchema: zodToJsonSchema(DeleteEmailSchema),
  handler: async (input: DeleteEmail, extra: { authInfo: AuthInfo }) => {
    const args = DeleteEmailSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      await gmail.users.messages.delete({
        userId: "me",
        id: args.messageId,
      });

      return {
        content: `Email ${args.messageId} deleted successfully`,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
