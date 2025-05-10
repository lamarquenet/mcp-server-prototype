import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";
import os from "os";
import http from "http";
import open from "open";

const CONFIG_DIR = path.join(os.homedir(), ".gmail-mcp");
const OAUTH_PATH = process.env.GMAIL_OAUTH_PATH || path.join(CONFIG_DIR, "gcp-oauth.keys.json");
const CREDENTIALS_PATH = process.env.GMAIL_CREDENTIALS_PATH || path.join(CONFIG_DIR, "credentials.json");

let oauth2Client: OAuth2Client;

export async function loadCredentials() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    const localOAuthPath = path.join(process.cwd(), "gcp-oauth.keys.json");
    if (fs.existsSync(localOAuthPath) && !fs.existsSync(OAUTH_PATH)) {
      fs.copyFileSync(localOAuthPath, OAUTH_PATH);
      console.log("OAuth keys found in current directory, copied to global config.");
    }

    if (!fs.existsSync(OAUTH_PATH)) {
      console.error("Error: OAuth keys file not found. Please place gcp-oauth.keys.json in the current directory or", CONFIG_DIR);
      process.exit(1);
    }

    const keysContent = JSON.parse(fs.readFileSync(OAUTH_PATH, "utf8"));
    const keys = keysContent.installed || keysContent.web;

    if (!keys) {
      console.error("Error: Invalid OAuth keys file format. File should contain either 'installed' or 'web' credentials.");
      process.exit(1);
    }

    const callback = process.argv[2] === "auth" && process.argv[3] ? process.argv[3] : "http://localhost:3000/oauth2callback";

    oauth2Client = new OAuth2Client(keys.client_id, keys.client_secret, callback);

    if (fs.existsSync(CREDENTIALS_PATH)) {
      const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
      oauth2Client.setCredentials(credentials);
    }
  } catch (error) {
    console.error("Error loading credentials:", error);
    process.exit(1);
  }
}

export async function authenticate() {
  const server = http.createServer();
  server.listen(3000);

  return new Promise<void>((resolve, reject) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/gmail.modify"],
    });

    console.log("Please visit this URL to authenticate:", authUrl);
    open(authUrl);

    server.on("request", async (req, res) => {
      if (!req.url?.startsWith("/oauth2callback")) return;

      const url = new URL(req.url, "http://localhost:3000");
      const code = url.searchParams.get("code");

      if (!code) {
        res.writeHead(400);
        res.end("No code provided");
        reject(new Error("No code provided"));
        return;
      }

      try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        console.log("Tokens acquired:", tokens);
        fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(tokens));

        res.writeHead(200);
        res.end("Authentication successful! You can close this window.");
        server.close();
        resolve();
      } catch (error) {
        res.writeHead(500);
        res.end("Authentication failed");
        reject(error);
      }
    });
  });
}

export function getOAuth2Client(): OAuth2Client {
  if (!oauth2Client) {
    throw new Error("OAuth2Client is not initialized. Call loadCredentials() before authenticate().");
  }
  return oauth2Client;
}
