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
  console.error("❌ Invalid environment variables:");
  if (err instanceof z.ZodError) {
    for (const issue of err.issues) {
      console.error(`- ${issue.path[0]}: ${issue.message}`);
    }
  } else {
    console.error(err);
  }
  process.exit(1);
}

const packageJsonPath = join(process.cwd(), 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const CONFIG = {
  NAME: `MCP Example`,
  VERSION: packageJson.version,
};

export { env }