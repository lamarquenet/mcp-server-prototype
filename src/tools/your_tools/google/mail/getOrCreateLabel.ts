import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { google } from "googleapis";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";

export const GetOrCreateLabelSchema = z.object({
  name: z.string().describe("Name of the label to get or create"),
  messageListVisibility: z.enum(["show", "hide"]).optional().describe("Whether to show or hide the label in the message list"),
  labelListVisibility: z.enum(["labelShow", "labelShowIfUnread", "labelHide"]).optional().describe("Visibility of the label in the label list"),
});

export type GetOrCreateLabel = z.infer<typeof GetOrCreateLabelSchema>;

/**
 * get or create label tool definition
 */
export const getOrCreateLabelTool = {
  name: "get_or_create_label",
  description: "Gets an existing label by name or creates it if it doesn't exist",
  inputSchema: zodToJsonSchema(GetOrCreateLabelSchema),
  handler: async (input: GetOrCreateLabel, extra: { authInfo: AuthInfo }) => {
    const args = GetOrCreateLabelSchema.parse(input);
    try {
      await loadCredentials();
      const oauth2Client = getOAuth2Client();
      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const labelsResponse = await gmail.users.labels.list({ userId: "me" });
      const existingLabel = labelsResponse.data.labels?.find((label) => label.name === args.name);

      if (existingLabel) {
        return {
          content: `Label found: ID: ${existingLabel.id}, Name: ${existingLabel.name}`,
        };
      }

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
