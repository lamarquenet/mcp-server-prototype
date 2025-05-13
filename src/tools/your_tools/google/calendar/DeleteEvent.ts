import { google } from 'googleapis';
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";
import { z } from 'zod';
import { DeleteEventArgumentsSchema } from "./schemas/validators.js";

export type DeleteEventArguments = z.infer<typeof DeleteEventArgumentsSchema>;

/**
 * delete event tool definition
 */
export const deleteEventTool = {
    name: "delete_event",
    description: "Delete a calendar event",
    inputSchema: zodToJsonSchema(DeleteEventArgumentsSchema),
    handler: async (input: DeleteEventArguments, extra: { authInfo: AuthInfo }) => {
        const args = DeleteEventArgumentsSchema.parse(input);
        try {
            await loadCredentials();
            const oauth2Client = getOAuth2Client();
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });
            const response = await calendar.events.delete({
                calendarId: args.calendarId,
                eventId: args.eventId,
            });
            // The delete operation typically returns an empty body on success
            // We can check the status or just return a success message if no error was thrown
            return { success: true, message: `Event with ID ${args.eventId} deleted successfully.` };
        } catch (error) {
            // It's better to throw the original error or a more specific one
            throw error;
        }
    },
};
