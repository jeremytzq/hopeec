export type TeamAssignment = {
  id: string;
  team: string;
  action: string;
};

export type Segment = {
  id: string;
  program: string;
  durationMin: number;
  fixedTime?: string; // optional override, else chained from plan startTime
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
  sermonTitle: string;
  speaker: string;
  holyCommunion: boolean;
  introNote: string;
  startTime: string; // "09:00"
  segments: Segment[];
  rehearsalStartTime: string; // "07:00"
  rehearsal: RehearsalItem[];
  callTimes: CallTimeItem[];
  teams: string[]; // ordered team names to render as sections in email
  recipientIds: string[];
  closingNote: string;
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
  return {
    id: date,
    date,
    serviceName: "Sunday East Adults 9:30am",
    teamGreetingName: "East Team",
    sermonTitle: "",
    speaker: "",
    holyCommunion: false,
    introNote:
      "**Everyone, please open the SERVICE BRIEF to read through the Service Program and this email thoroughly. Thank you for your spirit of excellence in thorough preparation.**",
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
