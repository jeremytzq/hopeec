import type { RosterPerson, WeeklyPlan } from "./types";
import { chainTimes, displayTime } from "./utils/time";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TABLE_STYLE = 'border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-family:Calibri,Arial,sans-serif;font-size:11pt"';

export function buildEmailHtml(plan: WeeklyPlan): string {
  const { times: segTimes } = chainTimes(plan.startTime, plan.segments);
  const startLabel = `${displayTime(plan.startTime)}${parseInt(plan.startTime.split(":")[0], 10) < 12 ? "AM" : "PM"}`;

  const parts: string[] = [];
  parts.push(`<p>Hi ${esc(plan.teamGreetingName)},</p>`);
  parts.push(`<p>&nbsp;</p>`);
  if (plan.introNote) {
    parts.push(`<p><b>${esc(plan.introNote)}</b></p>`);
    parts.push(`<p>&nbsp;</p>`);
  }

  parts.push(`<table ${TABLE_STYLE}>`);
  parts.push(
    `<tr><th style="background:#f2f2f2">Services</th><th style="background:#f2f2f2">Overview</th><th style="background:#f2f2f2">Holy Communion?</th></tr>`
  );
  parts.push(
    `<tr><td rowspan="2" style="text-align:center;font-weight:bold">${startLabel}</td><td>Service Title: &nbsp; ${esc(plan.sermonTitle)}</td><td rowspan="2" style="text-align:center;font-weight:bold">${plan.holyCommunion ? "Yes" : "No"}</td></tr>`
  );
  parts.push(`<tr><td>Speaker: &nbsp; ${esc(plan.speaker)}</td></tr>`);
  parts.push(`</table>`);
  parts.push(`<p>&nbsp;</p>`);

  for (const team of plan.teams) {
    const rows = plan.segments
      .map((seg, i) => ({ seg, time: segTimes[i], assignment: seg.assignments.find((a) => a.team === team) }))
      .filter((r) => r.assignment);
    if (rows.length === 0) continue;

    parts.push(`<p><b>${esc(team)}</b></p>`);
    parts.push(`<p>&nbsp;</p>`);
    parts.push(`<table ${TABLE_STYLE}>`);
    parts.push(
      `<tr><th style="background:#f2f2f2">Services</th><th style="background:#f2f2f2">Programme</th><th style="background:#f2f2f2">Action Required</th></tr>`
    );
    rows.forEach((r, i) => {
      const cells = [`<td>${esc(r.seg.program)}</td>`, `<td>${esc(r.assignment!.action)}</td>`];
      if (i === 0) {
        parts.push(`<tr><td rowspan="${rows.length}" style="text-align:center;font-weight:bold">${startLabel}</td>${cells.join("")}</tr>`);
      } else {
        parts.push(`<tr>${cells.join("")}</tr>`);
      }
    });
    parts.push(`</table>`);
    parts.push(`<p>&nbsp;</p>`);
  }

  if (plan.callTimes.length > 0) {
    parts.push(`<p><b>${esc(plan.serviceName.split(" ")[0])} ${esc(plan.teamGreetingName)}:</b></p>`);
    for (const ct of plan.callTimes) {
      parts.push(`<p><span style="color:red;font-weight:bold">${esc(displayTime(ct.time))}</span>&nbsp;&nbsp;${esc(ct.label)}</p>`);
    }
    parts.push(`<p>&nbsp;</p>`);
  }

  if (plan.closingNote) {
    parts.push(`<p>${esc(plan.closingNote).replace(/\n/g, "<br/>")}</p>`);
  }

  return parts.join("\n");
}

export function buildEmailSubject(plan: WeeklyPlan): string {
  return `[Service Brief] ${plan.serviceName} - ${plan.date}${plan.sermonTitle ? " - " + plan.sermonTitle : ""}`;
}

export function buildRecipientsString(plan: WeeklyPlan, roster: RosterPerson[]): string {
  const ids = new Set(plan.recipientIds);
  return roster
    .filter((p) => ids.has(p.id))
    .map((p) => p.email)
    .filter(Boolean)
    .join("; ");
}

export async function copyEmailToClipboard(plan: WeeklyPlan): Promise<void> {
  const html = buildEmailHtml(plan);
  const plain = html.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "");
  const item = new ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([plain], { type: "text/plain" }),
  });
  await navigator.clipboard.write([item]);
}
