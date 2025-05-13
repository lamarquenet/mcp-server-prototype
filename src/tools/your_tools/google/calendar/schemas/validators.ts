import { z } from 'zod';

// Zod schemas for input validation

export const ReminderSchema = z.object({
  method: z.enum(['email', 'popup']).default('popup').describe("Reminder method (defaults to popup unless email is specified)"),
  minutes: z.number().describe("Minutes before the event to trigger the reminder"),
});

export const RemindersSchema = z.object({
  useDefault: z.boolean().describe("Whether to use the default reminders"),
  overrides: z.array(ReminderSchema).optional().describe("Custom reminders (uses popup notifications by default unless email is specified)"),
});

// ISO datetime regex that requires timezone designator (Z or +/-HH:MM)
const isoDateTimeWithTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;

export const ListEventsArgumentsSchema = z.object({
  calendarId: z.string().describe("ID of the calendar to list events from (use 'primary' for the main calendar)"),
  timeMin: z.string()
    .regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.")
    .optional().describe("Start time in ISO format with timezone required (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset."),
  timeMax: z.string()
    .regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-12-31T23:59:59Z)")
    .optional().describe("End time in ISO format with timezone required (e.g., 2024-12-31T23:59:59Z or 2024-12-31T23:59:59+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset."),
});

export const SearchEventsArgumentsSchema = z.object({
  calendarId: z.string().describe("ID of the calendar to search events in (use 'primary' for the main calendar)"),
  query: z.string().describe("Free text search query (searches summary, description, location, attendees, etc.)"),
  timeMin: z.string()
    .regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.")
    .optional().describe("Start time boundary in ISO format with timezone required (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset."),
  timeMax: z.string()
    .regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-12-31T23:59:59Z)")
    .optional().describe("End time boundary in ISO format with timezone required (e.g., 2024-12-31T23:59:59Z or 2024-12-31T23:59:59+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset."),
});

export const CreateEventArgumentsSchema = z.object({
  calendarId: z.string().describe("ID of the calendar to create the event in (use 'primary' for the main calendar)"),
  summary: z.string().describe("Title of the event"),
  description: z.string().optional().describe("Description/notes for the event (optional)"),
  start: z.string().regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z)").describe("Start time in ISO format with timezone required (e.g., 2024-08-15T10:00:00Z or 2024-08-15T10:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset."),
  end: z.string().regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z)").describe("End time in ISO format with timezone required (e.g., 2024-08-15T11:00:00Z or 2024-08-15T11:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset."),
  timeZone: z.string().describe("Timezone of the event start/end times, formatted as an IANA Time Zone Database name (e.g., America/Los_Angeles). Required if start/end times are specified, especially for recurring events."),
  attendees: z
    .array(
      z.object({
        email: z.string().describe("Email address of the attendee"),
      })
    )
    .describe("List of attendee email addresses (optional)")
    .optional(),
  location: z.string().optional().describe("Location of the event (optional)"),
  colorId: z.string().optional().describe("Color ID for the event (optional, use list-colors to see available IDs)"),
  reminders: RemindersSchema.optional().describe("Reminder settings for the event"),
  recurrence: z.array(z.string()).optional().describe("List of recurrence rules (RRULE, EXRULE, RDATE, EXDATE) in RFC5545 format (optional). Example: [\"RRULE:FREQ=WEEKLY;COUNT=5\"]"),
});

export const UpdateEventArgumentsSchema = z.object({
  calendarId: z.string().describe("ID of the calendar containing the event"),
  eventId: z.string().describe("ID of the event to update"),
  summary: z.string().optional().describe("New title for the event (optional)"),
  description: z.string().optional().describe("New description for the event (optional)"),
  start: z.string()
    .regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.")
    .optional().describe("New start time in ISO format with timezone required (e.g., 2024-08-15T10:00:00Z or 2024-08-15T10:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset."),
  end: z.string()
    .regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.")
    .optional().describe("New end time in ISO format with timezone required (e.g., 2024-08-15T11:00:00Z or 2024-08-15T11:00:00-07:00). Date-time must end with Z (UTC) or +/-HH:MM offset."),
  timeZone: z.string().describe("Timezone for the start/end times (IANA format, e.g., America/Los_Angeles). Required if modifying start/end, or for recurring events."), // Required even if start/end don't change, per API docs for patch
  attendees: z
    .array(
      z.object({
        email: z.string().describe("Email address of the attendee"),
      })
    )
    .optional().describe("New list of attendee email addresses (optional, replaces existing attendees)"),
  location: z.string().optional().describe("New location for the event (optional)"),
  colorId: z.string().optional().describe("New color ID for the event (optional)"),
  reminders: RemindersSchema.optional().describe("New reminder settings for the event (optional)"),
  recurrence: z.array(z.string()).optional().describe("New list of recurrence rules (RFC5545 format, optional, replaces existing rules). Example: [\"RRULE:FREQ=DAILY;COUNT=10\"]"),
});

export const DeleteEventArgumentsSchema = z.object({
  calendarId: z.string().describe("ID of the calendar containing the event"),
  eventId: z.string().describe("ID of the event to delete"),
});

export const FreeBusyEventArgumentsSchema = z.object({
  timeMin: z.string()
    .regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.")
    .describe("The start of the interval in RFC3339 format"),
  timeMax: z.string()
    .regex(isoDateTimeWithTimezone, "Must be ISO format with timezone (e.g., 2024-01-01T00:00:00Z or 2024-01-01T00:00:00+00:00). Date-time must end with Z (UTC) or +/-HH:MM offset.")
    .describe("The end of the interval in RFC3339 format"),
  timeZone: z.string().optional().describe("Optional. Time zone used in the response (default is UTC)"),
  groupExpansionMax: z.number().int().max(100).optional().describe("Optional. Maximum number of calendar identifiers to expand per group (max 100)"),
  calendarExpansionMax: z.number().int().max(50).optional().describe("Optional. Maximum number of calendars to expand (max 50)"),
  items: z.array(z.object({
    id: z.string().email("Must be a valid email address").describe("The identifier of a calendar or group, it usually is a mail format"),
  })).describe("List of calendar or group identifiers to check for availability"),
});