import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../types/global.js";

export const SayHelloSchema = z.object({
  name: z.string().describe("name of the person to say hello to"),
});

export type SayHello= z.infer<typeof SayHelloSchema>;

/**
 * Initialize project tool definition
 */
export const sayHelloTool = {
  name: "say_hello",
  description: "say hello is a tool that returns a warm hello to the name provided.",
  inputSchema: zodToJsonSchema(SayHelloSchema),
  handler: async (input: SayHello, extra: { authInfo: AuthInfo; }) => {
    const args = SayHelloSchema.parse(input);
    try {
      const response = "hello " + args.name;

      return await response;
    } catch (e) {
      return e
    }
  },
};