import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { loadCredentials, getOAuth2Client } from "./utils/auth.js";

export const CreateLabelSchema = z.object({
  name: z.string().describe("Name for the new label"),
  messageListVisibility: z.enum(["show", "hide"]).optional().describe("Whether to show or hide the label in the message list"),
  labelListVisibility: z.enum(["labelShow", "labelShowIfUnread", "labelHide"]).optional().describe("Visibility of the label in the label list"),
});

export type CreateLabel = z.infer<typeof CreateLabelSchema>;

/**
 * create label tool definition
 */
export const createLabelTool = {
  name: "create_label",
  description: "Creates a new Gmail label",
  inputSchema: zodToJsonSchema(CreateLabelSchema),
  handler: async (input: CreateLabel, extra: { authInfo: AuthInfo }) => {
    const args = CreateLabelSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const response = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: args.name,
          messageListVisibility: args.messageListVisibility,
          labelListVisibility: args.labelListVisibility,
        },
      });

      return {
        content: `Label created successfully: ID: ${response.data.id}, Name: ${response.data.name}`,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "An unknown error occurred" };
    }
  },
};
