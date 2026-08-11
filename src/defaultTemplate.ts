import type { CallTimeItem, RehearsalItem, Segment, WeeklyPlan } from "./types";
import { uid } from "./types";

function seg(program: string, durationMin: number, assignments: [string, string][] = []): Segment {
  return {
    id: uid(),
    program,
    durationMin,
    assignments: assignments.map(([team, action]) => ({ id: uid(), team, action })),
  };
}

function reh(program: string, durationMin: number): RehearsalItem {
  return { id: uid(), program, durationMin };
}

function call(time: string, label: string): CallTimeItem {
  return { id: uid(), time, label };
}

/**
 * Recurring skeleton for a standard Sunday service, taken from the
 * "EC Adults Service Brief" template — same shape every week, only the
 * sermon/speaker/durations change.
 */
export function defaultSegments(): Segment[] {
  return [
    seg("Announcement Loop", 29),
    seg("1min Countdown (Live)", 1),
    seg("Praise & Worship (Live)", 20, [
      ["Service Leaders", "To open service and lead to praise"],
      ["SM and MM Teams", "MM: to ensure lyrics are shown promptly."],
    ]),
    seg("Close Worship (Live)", 3, [
      ["Service Leaders", "To close worship and transit to Welcome & Connect."],
    ]),
    seg("Holy Communion (Live)", 2, [
      ["Service Leaders", "To lead in Holy Communion."],
      ["SM and MM Teams", ""],
    ]),
    seg("Welcome and Connect (Live)", 1, [
      ["Service Leaders", "To welcome people warmly and standby Ushers to give out Gifts"],
    ]),
    seg("Tithing & Offering (Live)", 2, [
      ["Service Leaders", "Facilitate Tithing & Offering."],
      ["SM and MM Teams", "MM: to download from Dropbox. Play on SM's cue."],
    ]),
    seg("Preview (Live)", 3, [
      ["SM and MM Teams", "MM: to download from Dropbox. Play on SM's cue. Band to exit stage."],
    ]),
    seg("Sermon (Live)", 40),
    seg("Altar Call Song + Response (Live)", 15),
    seg("End Service Announcements (Live)", 5, [
      ["Service Leaders", "Refer to Jeremy's Announcements via WhatsApp this week."],
      ["SM and MM Teams", "Refer to Jeremy's Announcements via WhatsApp this week."],
    ]),
  ];
}

export function defaultRehearsal(): RehearsalItem[] {
  return [
    reh("Set Up + MM Checks", 20),
    reh("Soundcheck - Musios", 20),
    reh("Soundcheck - Vocalists", 20),
    reh("PnW Rehearsal", 30),
    reh("Soundcheck SL", 5),
    reh("Volunteers' Brief", 5),
    reh("Soundcheck PD & Victor", 5),
    reh("Tech Run", 30),
    reh("Heart Prep", 5),
    reh("Buffer", 0),
    { id: uid(), program: "Doors Open + Broadcast", durationMin: 0, fixedTime: "9:15", noDuration: true },
  ];
}

export function defaultCallTimes(): CallTimeItem[] {
  return [
    call("07:00", "Worship, Sound"),
    call("07:00", "MM, Broadcast, Video"),
    call("07:00", "Stage Managers"),
    call("08:00", "Testifiers"),
    call("08:30", "SL + Game Hosts"),
    call("08:30", "Preacher"),
  ];
}

export const DEFAULT_TEAMS_FULL = ["Service Leaders", "SM and MM Teams"];

/** Applies the recurring skeleton onto a plan, keeping the plan's own date/sermon/speaker/recipients. */
export function applyDefaultTemplate(plan: WeeklyPlan): WeeklyPlan {
  return {
    ...plan,
    serviceClockTime: "09:30",
    startTime: "09:00",
    segments: defaultSegments(),
    rehearsalStartTime: "07:00",
    rehearsal: defaultRehearsal(),
    callTimes: defaultCallTimes(),
    teams: [...DEFAULT_TEAMS_FULL],
    holyCommunion: true,
  };
}
