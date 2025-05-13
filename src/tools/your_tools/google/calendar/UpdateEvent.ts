import { google, calendar_v3 } from 'googleapis';
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";
import { z } from 'zod';
import { UpdateEventArgumentsSchema } from "./schemas/validators.js";

export type UpdateEventArguments = z.infer<typeof UpdateEventArgumentsSchema>;

/**
 * update event tool definition
 */
export const updateEventTool = {
    name: "update_event",
    description: "Updates an existing calendar event",
    inputSchema: zodToJsonSchema(UpdateEventArgumentsSchema),
    handler: async (input: UpdateEventArguments, extra: { authInfo: AuthInfo }) => {
        const args = UpdateEventArgumentsSchema.parse(input);
        try {
            await loadCredentials();
            const oauth2Client = getOAuth2Client();
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });

            const requestBody: calendar_v3.Schema$Event = {};
            if (args.summary !== undefined) requestBody.summary = args.summary;
            if (args.description !== undefined) requestBody.description = args.description;

            let timeChanged = false;
            if (args.start !== undefined) {
                requestBody.start = { dateTime: args.start, timeZone: args.timeZone };
                timeChanged = true;
            }
            if (args.end !== undefined) {
                requestBody.end = { dateTime: args.end, timeZone: args.timeZone };
                timeChanged = true;
            }

            // If start or end was changed, ensure both objects exist and have the timezone.
            // Also apply timezone if it's the only time-related field provided (for recurring events)
            if (timeChanged || (!args.start && !args.end && args.timeZone)) {
                if (!requestBody.start) requestBody.start = {};
                if (!requestBody.end) requestBody.end = {};
                // Only add timezone if not already added via dateTime object creation above
                if (!requestBody.start.timeZone) requestBody.start.timeZone = args.timeZone;
                if (!requestBody.end.timeZone) requestBody.end.timeZone = args.timeZone;
            }

            if (args.attendees !== undefined) requestBody.attendees = args.attendees;
            if (args.location !== undefined) requestBody.location = args.location;
            if (args.colorId !== undefined) requestBody.colorId = args.colorId;
            if (args.reminders !== undefined) requestBody.reminders = args.reminders;
            if (args.recurrence !== undefined) requestBody.recurrence = args.recurrence;

            const response = await calendar.events.patch({
                calendarId: args.calendarId,
                eventId: args.eventId,
                requestBody: requestBody,
            });
            if (!response.data) throw new Error('Failed to update event, no data returned');
            const updatedEvent = response.data;

            return {
                content: [{
                    type: "text",
                    text: `Event updated: ${updatedEvent.summary} (${updatedEvent.id})`,
                }],
            };

        } catch (error) {
            throw error;
        }
    },
};
