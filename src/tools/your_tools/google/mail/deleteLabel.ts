import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";

export const DeleteLabelSchema = z.object({
  id: z.string().describe("ID of the label to delete"),
});

export type DeleteLabel = z.infer<typeof DeleteLabelSchema>;

/**
 * delete label tool definition
 */
export const deleteLabelTool = {
  name: "delete_label",
  description: "Deletes a Gmail label",
  inputSchema: zodToJsonSchema(DeleteLabelSchema),
  handler: async (input: DeleteLabel, extra: { authInfo: AuthInfo }) => {
    const args = DeleteLabelSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      await gmail.users.labels.delete({
        userId: "me",
        id: args.id,
      });

      return {
        content: `Label deleted successfully: ID: ${args.id}`,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
