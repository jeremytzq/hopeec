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
    seg("1min Countdown (Broadcast from NEC)", 1, [
      ["Service Leaders", "To pray prior to start of service. End prayer when Countdown ends."],
    ]),
    seg("Praise & Worship (Broadcast from NEC)", 20, [
      ["MM Team", "To ensure lyrics are shown promptly."],
      ["SM Team", "To ensure stage plotting."],
    ]),
    seg("Close Worship (Broadcast from NEC)", 3, [
      ["Service Leaders", "To close worship and transit to Welcome & Connect."],
    ]),
    seg("Welcome and Connect (Live)", 1, [
      ["Service Leaders", "To welcome people warmly and standby Ushers to give out Gifts"],
    ]),
    seg("This is Home Segment (Live)", 5, [
      ["Service Leaders", "To facilitate"],
    ]),
    seg("Tithing & Offering (Live)", 3, [
      ["Service Leaders", "To facilitate the Tithe & Offering segment with proper transition."],
      ["MM Team", "To download the slides. Play on SM cue."],
    ]),
    seg("Preview (Live)", 3, [
      ["MM Team", "To download the slides. Play on SM cue."],
    ]),
    seg("Sermon (Recording)", 40, [
      ["MM Team", "To download the Saturday Recording."],
      ["Audio Team", "To ensure the sound is coming through"],
    ]),
    seg("Altar Call Song + Response (Live)", 15, [
      ["Service Leaders", "To be on stage before Sinner's Prayer"],
    ]),
    seg("End Service Announcements (Live)", 3, [
      ["Service Leaders", "Refer to Jeremy's Announcements via WhatsApp this week."],
      ["MM Team", "Refer to Jeremy's Announcements via WhatsApp this week."],
    ]),
  ];
}

export function defaultRehearsal(): RehearsalItem[] {
  return [
    reh("Set Up + MM Checks", 15),
    reh("Soundcheck - Musios", 15),
    reh("Soundcheck - Vocalists", 15),
    reh("PnW Rehearsal", 30),
    reh("Soundcheck SLs", 5),
    reh("Volunteers' Brief", 5),
    reh("Soundcheck Preacher", 5),
    reh("Tech Run + Heart Prep", 30),
    reh("Announcement Loop", 30),
    reh("Buffer", 0),
  ];
}

export function defaultCallTimes(): CallTimeItem[] {
  return [
    call("07:00", "Worship, Sound"),
    call("07:00", "MM, Broadcast, Video"),
    call("07:00", "Stage Managers"),
    call("07:30", "Environment"),
    call("08:00", "Security"),
    call("08:15", "Service Leaders"),
    call("08:45", "Preacher"),
  ];
}

export const DEFAULT_TEAMS_FULL = ["Service Leaders", "MM Team", "SM Team", "Audio Team"];

/** Applies the recurring skeleton onto a plan, keeping the plan's own date/sermon/speaker/recipients. */
export function applyDefaultTemplate(plan: WeeklyPlan): WeeklyPlan {
  return {
    ...plan,
    serviceClockTime: "09:30",
    startTime: "09:29",
    segments: defaultSegments(),
    rehearsalStartTime: "07:00",
    rehearsal: defaultRehearsal(),
    callTimes: defaultCallTimes(),
    teams: [...DEFAULT_TEAMS_FULL],
    holyCommunion: false,
  };
}
