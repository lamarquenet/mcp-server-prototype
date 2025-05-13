import { google, calendar_v3 } from 'googleapis';
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";

/**
 * list calendars tool definition
 */
export const listCalendarsTool = {
    name: "list_calendars",
    description: "Lists the user's calendars",
    inputSchema: zodToJsonSchema(z.object({})), // Empty schema as no arguments are needed
    handler: async (_: any, extra: { authInfo: AuthInfo }) => {
        try {
            await loadCredentials();
            const oauth2Client = getOAuth2Client();
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });

            const response = await calendar.calendarList.list();
            const calendars = response.data.items || [];

            /**
             * Formats a list of calendars into a user-friendly string.
             */
            const formatCalendarList = (calendars: calendar_v3.Schema$CalendarListEntry[]): string => {
                return calendars
                    .map((cal) => `${cal.summary || "Untitled"} (${cal.id || "no-id"})`)
                    .join("\n");
            };

            const formattedList = formatCalendarList(calendars);

            return {
                content: [{
                    type: "text",
                    text: formattedList,
                }],
            };

        } catch (error) {
            throw error;
        }
    },
};

import { z } from 'zod'; // Import z here as it's used in inputSchema
