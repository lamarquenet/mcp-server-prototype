import { google } from 'googleapis';
import { zodToJsonSchema } from "zod-to-json-schema";
import { AuthInfo } from "../../../../types/global.js";
import { loadCredentials, getOAuth2Client } from "../utils/auth.js";
import { z } from 'zod';
import { FreeBusyEventArgumentsSchema } from "./schemas/validators.js";
import { FreeBusyResponse } from './schemas/types.js';

export type FreeBusyEventArguments = z.infer<typeof FreeBusyEventArgumentsSchema>;

/**
 * free busy event tool definition
 */
export const freeBusyEventTool = {
    name: "free_busy_event",
    description: "Finds times when a group of calendars are busy or free",
    inputSchema: zodToJsonSchema(FreeBusyEventArgumentsSchema),
    handler: async (input: FreeBusyEventArguments, extra: { authInfo: AuthInfo }) => {
        const args = FreeBusyEventArgumentsSchema.parse(input);
        try {
            // Helper function to check if the time gap is less than 3 months
            const isLessThanThreeMonths = (timeMin: string, timeMax: string): boolean => {
                const minDate = new Date(timeMin);
                const maxDate = new Date(timeMax);
                const diffInMilliseconds = maxDate.getTime() - minDate.getTime();
                const threeMonthsInMilliseconds = 3 * 30 * 24 * 60 * 60 * 1000;
                return diffInMilliseconds <= threeMonthsInMilliseconds;
            };

            if (!isLessThanThreeMonths(args.timeMin, args.timeMax)) {
                return {
                    content: [{
                        type: "text",
                        text: "The time gap between timeMin and timeMax must be less than 3 months",
                    }],
                };
            }

            await loadCredentials();
            const oauth2Client = getOAuth2Client();
            const calendar = google.calendar({ version: "v3", auth: oauth2Client });

            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: args.timeMin,
                    timeMax: args.timeMax,
                    timeZone: args.timeZone,
                    groupExpansionMax: args.groupExpansionMax,
                    calendarExpansionMax: args.calendarExpansionMax,
                    items: args.items,
                },
            });

            const result = response.data as FreeBusyResponse;

            // Helper function to generate availability summary
            const generateAvailabilitySummary = (response: FreeBusyResponse): string => {
                return (Object.entries(response.calendars) as [string, { errors?: { domain: string; reason: string }[]; busy: { start: string; end: string; }[]; }][])
                    .map(([email, calendarInfo]) => {
                        if (calendarInfo.errors?.some((error) => error.reason === "notFound")) {
                            return `Cannot check availability for ${email} (account not found)\n`;
                        }

                        if (calendarInfo.busy.length === 0) {
                            return `${email} is available during ${response.timeMin} to ${response.timeMax}, please schedule calendar to ${email} if you want \n`;
                        }

                        const busyTimes = calendarInfo.busy
                            .map((slot) => `- From ${slot.start} to ${slot.end}`)
                            .join("\n");
                        return `${email} is busy during:\n${busyTimes}\n`;
                    })
                    .join("\n")
                    .trim();
            };

            const summaryText = generateAvailabilitySummary(result);

            return {
                content: [{
                    type: "text",
                    text: summaryText,
                }]
            };

        } catch (error) {
            throw error;
        }
    },
};
