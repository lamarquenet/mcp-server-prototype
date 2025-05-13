import { google, calendar_v3 } from 'googleapis';
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";
import { z } from 'zod';
import { SearchEventsArgumentsSchema } from "./schemas/validators.js";
import { formatEventList } from "./utils/utils.js";

export type SearchEventsArguments = z.infer<typeof SearchEventsArgumentsSchema>;

/**
 * search events tool definition
 */
export const searchEventsTool = {
    name: "search_events",
    description: "Searches for events on a calendar",
    inputSchema: zodToJsonSchema(SearchEventsArgumentsSchema),
    handler: async (input: SearchEventsArguments, extra: { authInfo: AuthInfo }) => {
        const args = SearchEventsArgumentsSchema.parse(input);
        try {
            await loadCredentials();
            const oauth2Client = getOAuth2Client();
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });

            const response = await calendar.events.list({
                calendarId: args.calendarId,
                q: args.query,
                timeMin: args.timeMin,
                timeMax: args.timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            });
            const events = response.data.items || [];

            const formattedList = formatEventList(events);

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
