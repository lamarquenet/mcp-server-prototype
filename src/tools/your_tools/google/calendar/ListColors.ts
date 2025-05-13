import { google, calendar_v3 } from 'googleapis';
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";
import { z } from 'zod'; // Import z here for zodToJsonSchema

/**
 * list colors tool definition
 */
export const listColorsTool = {
    name: "list_colors",
    description: "Lists available calendar colors",
    inputSchema: zodToJsonSchema(z.object({})), // Empty schema as no arguments are needed
    handler: async (_: any, extra: { authInfo: AuthInfo }) => {
        try {
            await loadCredentials();
            const oauth2Client = getOAuth2Client();
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });

            const response = await calendar.colors.get();
            if (!response.data) throw new Error('Failed to retrieve colors');
            const colors = response.data;

            /**
             * Formats the color information into a user-friendly string.
             */
            const formatColorList = (colors: calendar_v3.Schema$Colors): string => {
                const eventColors = colors.event || {};
                return Object.entries(eventColors)
                    .map(([id, colorInfo]) => `Color ID: ${id} - ${colorInfo.background} (background) / ${colorInfo.foreground} (foreground)`)
                    .join("\n");
            };

            const formattedList = formatColorList(colors);

            return {
                content: [{
                    type: "text",
                    text: `Available event colors:\n${formattedList}`,
                }],
            };

        } catch (error) {
            throw error;
        }
    },
};
