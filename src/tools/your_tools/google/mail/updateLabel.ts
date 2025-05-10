import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { getOAuth2Client, loadCredentials } from "./utils/auth.js";

export const UpdateLabelSchema = z.object({
  id: z.string().describe("ID of the label to update"),
  name: z.string().optional().describe("New name for the label"),
  messageListVisibility: z.enum(["show", "hide"]).optional().describe("Whether to show or hide the label in the message list"),
  labelListVisibility: z.enum(["labelShow", "labelShowIfUnread", "labelHide"]).optional().describe("Visibility of the label in the label list"),
});

export type UpdateLabel = z.infer<typeof UpdateLabelSchema>;

/**
 * update label tool definition
 */
export const updateLabelTool = {
  name: "update_label",
  description: "Updates an existing Gmail label",
  inputSchema: zodToJsonSchema(UpdateLabelSchema),
  handler: async (input: UpdateLabel, extra: { authInfo: AuthInfo }) => {
    const args = UpdateLabelSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const response = await gmail.users.labels.update({
        userId: "me",
        id: args.id,
        requestBody: {
          name: args.name,
          messageListVisibility: args.messageListVisibility,
          labelListVisibility: args.labelListVisibility,
        },
      });

      return {
        content: `Label updated successfully: ID: ${response.data.id}, Name: ${response.data.name}`,
      };
    } catch (e: unknown) {
      const error = e as Error;
      return { error: error.message };
    }
  },
};
