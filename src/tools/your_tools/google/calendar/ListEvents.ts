import { google, calendar_v3 } from 'googleapis';
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";
import { z } from 'zod';
import { ListEventsArgumentsSchema } from "./schemas/validators.js";
import { formatEventList } from "./utils/utils.js";

export type ListEventsArguments = z.infer<typeof ListEventsArgumentsSchema>;

/**
 * list events tool definition
 */
export const listEventsTool = {
    name: "list_events",
    description: "Lists events on a calendar",
    inputSchema: zodToJsonSchema(ListEventsArgumentsSchema),
    handler: async (input: ListEventsArguments, extra: { authInfo: AuthInfo }) => {
        const args = ListEventsArgumentsSchema.parse(input);
        try {
            await loadCredentials();
            const oauth2Client = getOAuth2Client();
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });

            const response = await calendar.events.list({
                calendarId: args.calendarId,
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
