# Gmail AutoAuth MCP Server

A Model Context Protocol (MCP) server for Gmail integration in Claude Desktop with auto authentication support. This server enables AI assistants to manage Gmail through natural language interactions.

## Features

- Send emails with subject, content, attachments, and recipients
- Full support for international characters in subject lines and email content
- Read email messages by ID with advanced MIME structure handling
- View email attachments information (filenames, types, sizes)
- Search emails with various criteria (subject, sender, date range)
- **Comprehensive label management with ability to create, update, delete and list labels**
- List all available Gmail labels (system and user-defined)
- List emails in inbox, sent, or custom labels
- Mark emails as read/unread
- Move emails to different labels/folders
- Delete emails
- **Batch operations for efficiently processing multiple emails at once**
- Full integration with Gmail API
- Simple OAuth2 authentication flow with auto browser launch
- Support for both Desktop and Web application credentials
- Global credential storage for convenience

## Installation & Authentication

### Installing via Smithery

[![smithery badge](https://smithery.ai/badge/@lamarquenet/mcp-server-prototype)](https://smithery.ai/server/@lamarquenet/mcp-server-prototype)
To install Gmail AutoAuth for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@lamarquenet/mcp-server-prototype):

```bash
npx -y @smithery/cli install @lamarquenet/mcp-server-prototype --client claude
```

### Installing Manually
1. Create a Google Cloud Project and obtain credentials:

   a. Create a Google Cloud Project:
      - Go to [Google Cloud Console](https://console.cloud.google.com/)
      - Create a new project or select an existing one
      - Enable the Gmail API and calendar for your project

   b. Create OAuth 2.0 Credentials:
      - Go to "APIs & Services" > "Credentials"
      - Click "Create Credentials" > "OAuth client ID"
      - Choose either "Desktop app" or "Web application" as application type
      - Give it a name and click "Create"
      - For Web application, add `http://localhost:3000/oauth2callback` to the authorized redirect URIs
      - Download the JSON file of your client's OAuth keys
      - Rename the key file to `gcp-oauth.keys.json`

2. Run Authentication:

   You can authenticate in two ways:

   a. Global Authentication (Recommended):
   ```bash
   # First time: Place gcp-oauth.keys.json in your home directorys .gmail-mcp folder
   mkdir -p ~/.gmail-mcp
   mv gcp-oauth.keys.json ~/.gmail-mcp/

   # Run authentication from anywhere
   npx npx git+https://github.com/lamarquenet/mcp-server-prototype.git auth

   mkdir mcp-test
   cd mcp-test
   npm init -y
   npx git+https://github.com/lamarquenet/mcp-server-prototype.git auth

   ```

   b. Local Authentication:
   ```bash
   # Place gcp-oauth.keys.json in your current directory
   # The file will be automatically copied to global config
   npx @lamarquenet/mcp-server-prototype auth
   ```

   The authentication process will:
   - Look for `gcp-oauth.keys.json` in the current directory or `~/.gmail-mcp/`
   - If found in current directory, copy it to `~/.gmail-mcp/`
   - Open your default browser for Google authentication
   - Save credentials as `~/.gmail-mcp/credentials.json`

   > **Note**: 
   > - After successful authentication, credentials are stored globally in `~/.gmail-mcp/` and can be used from any directory
   > - Both Desktop app and Web application credentials are supported
   > - For Web application credentials, make sure to add `http://localhost:3000/oauth2callback` to your authorized redirect URIs

3. Configure in Claude Desktop:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": [
        "@lamarquenet/mcp-server-prototype"
      ]
    }
  }
}
```
Or use a proxy if over the network, recommended one https://www.npmjs.com/package/mcp-remote
Install the package on the os where your claude is located and add the following config
{
  "mcpServers": {
    "remote-example": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://192.168.8.20:5680/sse",
        "--allow-http",
      ]
    }
  }
}
//the flag --allow-http allow you to use dev servers not https

Available Strategies:
http-first (default): Tries HTTP transport first, falls back to SSE if HTTP fails with a 404 error
sse-first: Tries SSE transport first, falls back to HTTP if SSE fails with a 405 error
http-only: Only uses HTTP transport, fails if the server doesn't support it
sse-only: Only uses SSE transport, fails if the server doesn't support it

To use with mcp or http you can use 
"nico-mcp-remote": {
      "command": "npx",
      "args": [
        "mcp-remote", 
        "http://192.168.8.20:5680/mcp",
        "--allow-http",
        "--transport",
        "http-first"
      ]
    }

### Docker Support requested by el Zamarra :P

If you prefer using Docker:

1. Authentication:
```bash
docker run -i --rm \
  --mount type=bind,source=/path/to/gcp-oauth.keys.json,target=/gcp-oauth.keys.json \
  -v mcp-gmail:/gmail-server \
  -e GMAIL_OAUTH_PATH=/gcp-oauth.keys.json \
  -e "GMAIL_CREDENTIALS_PATH=/gmail-server/credentials.json" \
  -p 3000:3000 \
  -p 5680:5680 \
  mcp/gmail auth
```
This will run a container with port 3000 open for oauth call back auth, and the sse / mcp http transports. If you want to start it on stdio pass as param stdio on the start

How to connect to the docker:
Install https://www.npmjs.com/package/mcp-remote and add this config in claude:

use:
"nico-mcp-remote": {
      "command": "npx",
      "args": [
        "mcp-remote", 
        "http://ipofdockerUrl:5680/mcp",
        "--allow-http"
      ]
    }


2. Usage:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "mcp-gmail:/gmail-server",
        "-e",
        "GMAIL_CREDENTIALS_PATH=/gmail-server/credentials.json",
        "mcp/gmail"
      ]
    }
  }
}
```

### Cloud Server Authentication

For cloud server environments (like n8n), you can specify a custom callback URL during authentication:

```bash
npx @lamarquenet/mcp-server-prototype auth https://yourUrl.com/oauth2callback
```

#### Setup Instructions for Cloud Environment

1. **Configure Reverse Proxy:**
   - Set up your n8n container to expose a port for authentication
   - Configure a reverse proxy to forward traffic from your domain (e.g., `yourUrl.com`) to this port

2. **DNS Configuration:**
   - Add an A record in your DNS settings to resolve your domain to your cloud server's IP address

3. **Google Cloud Platform Setup:**
   - In your Google Cloud Console, add your custom domain callback URL (e.g., `https://yourUrl.com/oauth2callback`) to the authorized redirect URIs list

4. **Run Authentication:**
   ```bash
   npx @lamarquenet/mcp-server-prototype auth https://yourUrl.com/oauth2callback
   ```

5. **Configure in your application:**
   ```json
   {
     "mcpServers": {
       "gmail": {
         "command": "npx",
         "args": [
           "@lamarquenet/mcp-server-prototype"
         ]
       }
     }
   }
   ```

This approach allows authentication flows to work properly in environments where localhost isn't accessible, such as containerized applications or cloud servers.

## Available Tools

The server provides the following tools that can be used through Claude Desktop:

### 1. Send Email (`send_email`)
Sends a new email immediately.

```json
{
  "to": ["recipient@example.com"],
  "subject": "Meeting Tomorrow",
  "body": "Hi,\n\nJust a reminder about our meeting tomorrow at 10 AM.\n\nBest regards",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"]
}
```

### 2. Draft Email (`draft_email`)
Creates a draft email without sending it.

```json
{
  "to": ["recipient@example.com"],
  "subject": "Draft Report",
  "body": "Here's the draft report for your review.",
  "cc": ["manager@example.com"]
}
```

### 3. Read Email (`read_email`)
Retrieves the content of a specific email by its ID.

```json
{
  "messageId": "182ab45cd67ef"
}
```

### 4. Search Emails (`search_emails`)
Searches for emails using Gmail search syntax.

```json
{
  "query": "from:sender@example.com after:2024/01/01 has:attachment",
  "maxResults": 10
}
```

### 5. Modify Email (`modify_email`)
Adds or removes labels from emails (move to different folders, archive, etc.).

```json
{
  "messageId": "182ab45cd67ef",
  "addLabelIds": ["IMPORTANT"],
  "removeLabelIds": ["INBOX"]
}
```

### 6. Delete Email (`delete_email`)
Permanently deletes an email.

```json
{
  "messageId": "182ab45cd67ef"
}
```

### 7. List Email Labels (`list_email_labels`)
Retrieves all available Gmail labels.

```json
{}
```

### 8. Create Label (`create_label`)
Creates a new Gmail label.

```json
{
  "name": "Important Projects",
  "messageListVisibility": "show",
  "labelListVisibility": "labelShow"
}
```

### 9. Update Label (`update_label`)
Updates an existing Gmail label.

```json
{
  "id": "Label_1234567890",
  "name": "Urgent Projects",
  "messageListVisibility": "show",
  "labelListVisibility": "labelShow"
}
```

### 10. Delete Label (`delete_label`)
Deletes a Gmail label.

```json
{
  "id": "Label_1234567890"
}
```

### 11. Get or Create Label (`get_or_create_label`)
Gets an existing label by name or creates it if it doesn't exist.

```json
{
  "name": "Project XYZ",
  "messageListVisibility": "show",
  "labelListVisibility": "labelShow"
}
```

### 12. Batch Modify Emails (`batch_modify_emails`)
Modifies labels for multiple emails in efficient batches.

```json
{
  "messageIds": ["182ab45cd67ef", "182ab45cd67eg", "182ab45cd67eh"],
  "addLabelIds": ["IMPORTANT"],
  "removeLabelIds": ["INBOX"],
  "batchSize": 50
}
```

### 13. Batch Delete Emails (`batch_delete_emails`)
Permanently deletes multiple emails in efficient batches.

```json
{
  "messageIds": ["182ab45cd67ef", "182ab45cd67eg", "182ab45cd67eh"],
  "batchSize": 50
}
```

## Advanced Search Syntax

The `search_emails` tool supports Gmail's powerful search operators:

| Operator | Example | Description |
|----------|---------|-------------|
| `from:` | `from:john@example.com` | Emails from a specific sender |
| `to:` | `to:mary@example.com` | Emails sent to a specific recipient |
| `subject:` | `subject:"meeting notes"` | Emails with specific text in the subject |
| `has:attachment` | `has:attachment` | Emails with attachments |
| `after:` | `after:2024/01/01` | Emails received after a date |
| `before:` | `before:2024/02/01` | Emails received before a date |
| `is:` | `is:unread` | Emails with a specific state |
| `label:` | `label:work` | Emails with a specific label |

You can combine multiple operators: `from:john@example.com after:2024/01/01 has:attachment`

## Advanced Features

### Email Content Extraction

The server intelligently extracts email content from complex MIME structures:

- Prioritizes plain text content when available
- Falls back to HTML content if plain text is not available
- Handles multi-part MIME messages with nested parts
- Processes attachments information (filename, type, size)
- Preserves original email headers (From, To, Subject, Date)

### International Character Support

The server fully supports non-ASCII characters in email subjects and content, including:
- Turkish, Chinese, Japanese, Korean, and other non-Latin alphabets
- Special characters and symbols
- Proper encoding ensures correct display in email clients

### Comprehensive Label Management

The server provides a complete set of tools for managing Gmail labels:

- **Create Labels**: Create new labels with customizable visibility settings
- **Update Labels**: Rename labels or change their visibility settings
- **Delete Labels**: Remove user-created labels (system labels are protected)
- **Find or Create**: Get a label by name or automatically create it if not found
- **List All Labels**: View all system and user labels with detailed information
- **Label Visibility Options**: Control how labels appear in message and label lists

Label visibility settings include:
- `messageListVisibility`: Controls whether the label appears in the message list (`show` or `hide`)
- `labelListVisibility`: Controls how the label appears in the label list (`labelShow`, `labelShowIfUnread`, or `labelHide`)

These label management features enable sophisticated organization of emails directly through Claude, without needing to switch to the Gmail interface.

### Batch Operations

The server includes efficient batch processing capabilities:

- Process up to 50 emails at once (configurable batch size)
- Automatic chunking of large email sets to avoid API limits
- Detailed success/failure reporting for each operation
- Graceful error handling with individual retries
- Perfect for bulk inbox management and organization tasks

## Security Notes

- OAuth credentials are stored securely in your local environment (`~/.gmail-mcp/`)
- The server uses offline access to maintain persistent authentication
- Credentials are stored globally but are only accessible by the current user

## Troubleshooting

1. **OAuth Keys Not Found**
   - Make sure `gcp-oauth.keys.json` is in either your current directory or `~/.gmail-mcp/`
   - Check file permissions

2. **Invalid Credentials Format**
   - Ensure your OAuth keys file contains either `web` or `installed` credentials
   - For web applications, verify the redirect URI is correctly configured

3. **Port Already in Use**
   - If you authentication port 3000 is already in use, please free it up before running authentication
   - You can find and stop the process using that port

4. **Batch Operation Failures**
   - If batch operations fail, they automatically retry individual items
   - Check the detailed error messages for specific failures
   - Consider reducing the batch size if you encounter rate limiting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.


Possible configurations:
-------------------------------------Works on tootls that support sse like roo code and others
"mcp-server-prototype": {
      "type": "sse",
      "url": "http://192.168.8.209:5680/sse?token=tokenSimple",
      "alwaysAllow": [
        "say_hello",
        "search_emails",
        "read_email"
      ],
      "disabled": false
}

------------------------------------Could not make it work this way in claude or roo code, if someone know why let me know
"mcp-server-prototype": {
      "command": "npx",
      "args": [
        "-y",
        "supergateway",
        "--sse",
        "http://192.168.8.209:5680/sse?token=tokenSimple"
      ]
    }
------------------way of running a locally hosted version, needs to put in the args the location of the server file, windows location for claude
------------------you can use the setup script to get the location of claude if you are on the same machine.
"mcp-server-prototype": {
      "command": "node",
      "args": [
        "./dist/server.js",
        "stdio"
      ],
      "env":{
        "token": "tokenClaude"
      },
      "disabled": false,
      "alwaysAllow": []
    }