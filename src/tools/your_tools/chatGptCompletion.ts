import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../types/global.js";

export const ChatGptCompletionSchema = z.object({
  model: z.string().describe("the model from openai to use, if the user don't provide it don't sen't nothing here").optional().default("gpt-4"),
  messages: z.string().describe("the messages to send to the model"), 
  temperature: z.number().optional().describe("the temperature to use for the model, optional"),
});

export type ChatGptCompletion= z.infer<typeof ChatGptCompletionSchema>;

/**
 * Initialize project tool definition
 */
export const chatWithOpenAiTool = {
  name: "chat_with_openai",
  description: "chat with openai is a tool to talk with chatgpt open ai models of your choice. You provide a message and the model will respond to you.",
  inputSchema: zodToJsonSchema(ChatGptCompletionSchema),
  handler: async (input: ChatGptCompletion, extra: { authInfo: AuthInfo; }) => {
    const args = ChatGptCompletionSchema.parse(input);
    try {
      if (!extra.authInfo.token) {
        throw new Error("Missing chatGptApiKey information");
      }
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + extra.authInfo.token,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: args.messages }
          ]
        })
      });
     
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      return await response.json();
    } catch (e) {
      return e
    }
  },
};