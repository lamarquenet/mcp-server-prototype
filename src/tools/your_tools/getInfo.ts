import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../types/global.js";

export const GetInfoSchema = z.object({
  paramsApi: z.string().describe("your param API"),
});

export type GetInfo = z.infer<typeof GetInfoSchema>

/**
 * Initialize project tool definition
 * this is a tool that based on recieved query params will call an api
 * and return the response
 * 
 */
export const getInfoTool = {
  name: "get_info",
  description: "Receives, processes, and manages all info through our APIs.",
  inputSchema: zodToJsonSchema(GetInfoSchema),
  handler: async (input: GetInfo, extra: { authInfo: AuthInfo; }) => {
    const args = GetInfoSchema.parse(input);
    try {
      if (!extra.authInfo.token) {
        throw new Error("Missing authentication information");
      }
      const response = await fetch('https://www.googleapis.com/customsearch/v1', {
        headers: {
          Authorization: `Bearer ${extra.authInfo.token}`,
        },
        ...args,
      })
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      return await response.json();
    } catch (e) {
      return e
    }
  },
};