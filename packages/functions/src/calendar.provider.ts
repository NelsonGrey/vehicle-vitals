export interface CalendarEventInput {
  vehicleVin: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  target: string;
}

export interface CalendarEventOutput {
  eventId: string;
  actionUrl?: string;
  downloadUrl?: string;
  delivery?: string;
}

/**
 * Escape ICS-reserved characters.
 * @param {string} value Raw value
 * @return {string} Escaped value
 */
function escapeIcs(value: string): string {
  return (value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Convert ISO timestamp to ICS UTC format.
 * @param {string} iso ISO timestamp
 * @return {string} ICS timestamp
 */
function toIcsTimestamp(iso: string): string {
  const d = new Date(iso);
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Build an ICS calendar event payload.
 * @param {CalendarEventInput} input Event input
 * @return {{eventId: string, downloadUrl: string}} Encoded calendar output
 */
export function buildIcsEvent(input: CalendarEventInput): {
  eventId: string;
  downloadUrl: string;
} {
  const uid = `${Date.now()}-${input.vehicleVin}@vehicle-vitals`;
  const startTs = toIcsTimestamp(input.startAt);
  const endTs = toIcsTimestamp(input.endAt || input.startAt);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vehicle Vitals//Maintenance//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsTimestamp(new Date().toISOString())}`,
    `DTSTART:${startTs}`,
    `DTEND:${endTs}`,
    `SUMMARY:${escapeIcs(input.title)}`,
    `DESCRIPTION:${escapeIcs(
      input.description || "Vehicle maintenance event"
    )}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const encoded = encodeURIComponent(ics);
  return {
    eventId: uid,
    downloadUrl: `data:text/calendar;charset=utf-8,${encoded}`,
  };
}

/**
 * Build a Google Calendar event creation URL.
 * @param {CalendarEventInput} input Event input
 * @return {CalendarEventOutput} Event output with action URL
 */
export function buildGoogleCalendarEvent(
  input: CalendarEventInput
): CalendarEventOutput {
  const eventId = `${Date.now()}-${input.vehicleVin}-google`;
  const startTs = toIcsTimestamp(input.startAt);
  const endTs = toIcsTimestamp(input.endAt || input.startAt);
  const actionUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(input.title)}` +
    `&dates=${encodeURIComponent(`${startTs}/${endTs}`)}` +
    `&details=${encodeURIComponent(
      input.description || "Vehicle maintenance event"
    )}`;

  return {
    eventId,
    actionUrl,
  };
}

/**
 * Build an Apple Calendar import payload.
 * Apple Calendar web flow uses ICS import semantics, so we return an ICS URL.
 * @param {CalendarEventInput} input Event input
 * @return {CalendarEventOutput} Event output with ICS download URL
 */
export function buildAppleCalendarEvent(
  input: CalendarEventInput
): CalendarEventOutput {
  const ics = buildIcsEvent(input);
  return {
    eventId: `${ics.eventId}-apple`,
    downloadUrl: ics.downloadUrl,
    delivery: "ics_import",
  };
}
