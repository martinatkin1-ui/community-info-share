import { parse } from "chrono-node";

import type { ScrapedEvent } from "@/types/scraping";

const MONTH_PATTERN = /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}(\/\d{2,4})?)/i;
const TIME_PATTERN = /\b([01]?\d|2[0-3])[:.][0-5]\d\s?(am|pm)?\b|\b([1-9]|1[0-2])\s?(am|pm)\b/i;

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function scoreConfidence(line: string, hasDate: boolean, hasTime: boolean): number {
  let score = 0.35;

  if (hasDate) score += 0.35;
  if (hasTime) score += 0.2;
  if (line.length >= 18 && line.length <= 140) score += 0.1;

  return Math.min(0.95, Number(score.toFixed(2)));
}

function extractEventName(candidateLine: string, fallbackLine: string | undefined): string {
  const stripped = candidateLine
    .replace(/\b\d{1,2}[:.]\d{2}\s?(am|pm)?\b/gi, "")
    .replace(/\b\d{1,2}(st|nd|rd|th)?\b/gi, "")
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi, "")
    .replace(/[-–|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length >= 5) {
    return stripped;
  }

  return cleanText(fallbackLine ?? candidateLine).slice(0, 120);
}

export function parseEventsFromText(rawText: string, sourceUrl: string): ScrapedEvent[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter((line) => line.length >= 8)
    .slice(0, 2500);

  const events: ScrapedEvent[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const hasDateSignal = MONTH_PATTERN.test(line);

    if (!hasDateSignal) {
      continue;
    }

    const nextLine = lines[index + 1];
    const previousLine = lines[index - 1];
    const combined = `${line}${nextLine ? ` ${nextLine}` : ""}`;
    const parsed = parse(combined, new Date(), { forwardDate: true })[0];

    if (!parsed?.start) {
      continue;
    }

    const startDate = parsed.start.date();
    const hasTime = TIME_PATTERN.test(combined);
    const eventName = extractEventName(line, previousLine);

    events.push({
      tempId: `${startDate.getTime()}-${events.length + 1}`,
      eventName,
      dateText: startDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      timeText: hasTime
        ? startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        : null,
      startsAtIso: startDate.toISOString(),
      sourceSnippet: cleanText(combined).slice(0, 220),
      sourceUrl,
      confidence: scoreConfidence(combined, true, hasTime),
    });
  }

  const deduped = new Map<string, ScrapedEvent>();

  for (const event of events) {
    const dedupeKey = `${event.eventName.toLowerCase()}|${event.startsAtIso}`;
    if (!deduped.has(dedupeKey)) {
      deduped.set(dedupeKey, event);
    }
  }

  return Array.from(deduped.values()).slice(0, 40);
}
