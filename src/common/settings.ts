import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from "dotenv";

dotenv.config();

const schema = z.object({
  PORT: z.string().default('5680'),
});

let env: z.infer<typeof schema>;

try {
  env = schema.parse(process.env);
} catch (err) {
  process.stderr.write("❌ Invalid environment variables:\n");
  if (err instanceof z.ZodError) {
    for (const issue of err.issues) {
      process.stderr.write(`- ${issue.path[0]}: ${issue.message}\n`);
    }
  } else {
    process.stderr.write(String(err) + '\n');
  }
  process.exit(1);
}

/*This prevent me from running the auth from anywhere without creating a new package.json so better do it manually here
const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));*/

export const CONFIG = {
  NAME: `MCP Example`,
  VERSION: `0.1`,
};

export { env }