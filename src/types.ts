import { deriveShortServiceName, formatLongDate } from "./utils/time";

export type TeamAssignment = {
  id: string;
  team: string;
  action: string; // rich-text HTML from the compact action editor
};

export type Segment = {
  id: string;
  program: string;
  durationMin: number;
  assignments: TeamAssignment[];
};

export type RehearsalItem = {
  id: string;
  program: string;
  durationMin: number;
  fixedTime?: string;
  noDuration?: boolean; // e.g. "Doors Open + Broadcast" has no duration, just a time label
};

export type CallTimeItem = {
  id: string;
  time: string;
  label: string; // e.g. "Worship, Sound"
};

export type RosterPerson = {
  id: string;
  name: string;
  email: string;
  team: string;
  active: boolean;
};

export type WeeklyPlan = {
  id: string; // iso date, also used as storage key
  date: string; // yyyy-mm-dd
  serviceName: string; // "Sunday East Adults 9:30am"
  teamGreetingName: string; // "East Team"
  emailSubject: string; // e.g. "[East Adults] Service Brief for 9 August 2026"
  sermonTitle: string;
  speaker: string;
  holyCommunion: boolean;
  introNote: string; // rich-text HTML from the intro note editor (bold/italic/underline/lists)
  serviceClockTime: string; // "09:30" - the public service time shown in the email's "Services" column
  startTime: string; // "09:00" - when the pre-service order of service actually begins (for chaining)
  segments: Segment[];
  rehearsalStartTime: string; // "07:00"
  rehearsal: RehearsalItem[];
  callTimes: CallTimeItem[];
  teams: string[]; // ordered team names to render as sections in email
  recipientIds: string[];
  closingNote: string; // rich-text HTML from the closing note editor
};

export const DEFAULT_TEAMS = ["Service Leaders", "SM and MM Teams"];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function blankSegment(): Segment {
  return { id: uid(), program: "", durationMin: 5, assignments: [] };
}

export function blankRehearsal(): RehearsalItem {
  return { id: uid(), program: "", durationMin: 5 };
}

export function blankCallTime(): CallTimeItem {
  return { id: uid(), time: "", label: "" };
}

export function blankPlan(date: string): WeeklyPlan {
  const serviceName = "Sunday East Adults 9:30am";
  return {
    id: date,
    date,
    serviceName,
    teamGreetingName: "East Team",
    emailSubject: `[${deriveShortServiceName(serviceName)}] Service Brief for ${formatLongDate(date)}`,
    sermonTitle: "",
    speaker: "",
    holyCommunion: false,
    introNote:
      "<b>Everyone, please open the SERVICE BRIEF to read through the Service Program and this email thoroughly. Thank you for your spirit of excellence in thorough preparation.</b>",
    serviceClockTime: "09:30",
    startTime: "09:00",
    segments: [],
    rehearsalStartTime: "07:00",
    rehearsal: [],
    callTimes: [],
    teams: [...DEFAULT_TEAMS],
    recipientIds: [],
    closingNote: "",
  };
}
