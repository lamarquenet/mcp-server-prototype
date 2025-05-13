import { CreateEventArgumentsSchema } from "./schemas/validators.js";
import { calendar_v3, google } from 'googleapis';
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";
import { z } from 'zod';

export type CreateEventArguments = z.infer<typeof CreateEventArgumentsSchema>;

/**
 * delete email tool definition
 */
export const createEventTool = {
    name: "create_event",
    description: "Create a new calendar event",
    inputSchema: zodToJsonSchema(CreateEventArgumentsSchema),
    handler: async (input: CreateEventArguments, extra: { authInfo: AuthInfo }) => {
        const args = CreateEventArgumentsSchema.parse(input);
        try {
            await loadCredentials();
            const oauth2Client = getOAuth2Client();
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });
            const requestBody: calendar_v3.Schema$Event = {
                summary: args.summary,
                description: args.description,
                start: { dateTime: args.start, timeZone: args.timeZone },
                end: { dateTime: args.end, timeZone: args.timeZone },
                attendees: args.attendees,
                location: args.location,
                colorId: args.colorId,
                reminders: args.reminders,
                recurrence: args.recurrence,
            };
            const response = await calendar.events.insert({
                calendarId: args.calendarId,
                requestBody: requestBody,
            });
            if (!response.data) throw new Error('Failed to create event, no data returned');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};
