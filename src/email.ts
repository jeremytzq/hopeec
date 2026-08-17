import type { RosterPerson, WeeklyPlan } from "./types";
import { chainTimes, displayTimeWithMeridiem } from "./utils/time";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Outlook renders pasted HTML through Word's engine, which does not reliably
// cascade font-family/size from a wrapping element down into <table>/<td>/<th> -
// every text-bearing tag below sets this explicitly rather than relying on inheritance.
const FONT = "font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#000000;";
const TABLE_STYLE = `border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;${FONT}"`;

export function buildEmailHtml(plan: WeeklyPlan): string {
  const { times: segTimes } = chainTimes(plan.startTime, plan.segments);
  const startLabel = displayTimeWithMeridiem(plan.serviceClockTime || plan.startTime).replace(" ", "");

  const parts: string[] = [];
  parts.push(`<p style="${FONT}">Hi ${esc(plan.teamGreetingName)},</p>`);
  parts.push(`<p style="${FONT}">&nbsp;</p>`);
  if (plan.introNote) {
    parts.push(`<p style="${FONT}"><b>${esc(plan.introNote)}</b></p>`);
    parts.push(`<p style="${FONT}">&nbsp;</p>`);
  }

  parts.push(`<table ${TABLE_STYLE}>`);
  parts.push(
    `<tr><th style="${FONT}background:#f2f2f2;font-weight:bold">Services</th><th style="${FONT}background:#f2f2f2;font-weight:bold">Overview</th><th style="${FONT}background:#f2f2f2;font-weight:bold">Holy Communion?</th></tr>`
  );
  parts.push(
    `<tr><td rowspan="2" style="${FONT}text-align:center;font-weight:bold">${startLabel}</td><td style="${FONT}">Service Title: &nbsp; ${esc(plan.sermonTitle)}</td><td rowspan="2" style="${FONT}text-align:center;font-weight:bold">${plan.holyCommunion ? "Yes" : "No"}</td></tr>`
  );
  parts.push(`<tr><td style="${FONT}">Speaker: &nbsp; ${esc(plan.speaker)}</td></tr>`);
  parts.push(`</table>`);
  parts.push(`<p style="${FONT}">&nbsp;</p>`);

  for (const team of plan.teams) {
    const rows = plan.segments
      .map((seg, i) => ({ seg, time: segTimes[i], assignment: seg.assignments.find((a) => a.team === team) }))
      .filter((r) => r.assignment);
    if (rows.length === 0) continue;

    parts.push(`<p style="${FONT}"><b>${esc(team)}</b></p>`);
    parts.push(`<table ${TABLE_STYLE}>`);
    parts.push(
      `<tr><th style="${FONT}background:#f2f2f2;font-weight:bold">Services</th><th style="${FONT}background:#f2f2f2;font-weight:bold">Programme</th><th style="${FONT}background:#f2f2f2;font-weight:bold">Action Required</th></tr>`
    );
    rows.forEach((r, i) => {
      const cells = [`<td style="${FONT}">${esc(r.seg.program)}</td>`, `<td style="${FONT}">${esc(r.assignment!.action)}</td>`];
      if (i === 0) {
        parts.push(`<tr><td rowspan="${rows.length}" style="${FONT}text-align:center;font-weight:bold">${startLabel}</td>${cells.join("")}</tr>`);
      } else {
        parts.push(`<tr>${cells.join("")}</tr>`);
      }
    });
    parts.push(`</table>`);
    parts.push(`<p style="${FONT}">&nbsp;</p>`);
  }

  if (plan.callTimes.length > 0) {
    const CALL_GREEN = "#16a34a";
    const CALL_TINT = "#eafbf1";
    const CALL_BORDER = "#bfe8cd";
    parts.push(`<p style="${FONT}"><b>${esc(plan.serviceName.split(" ")[0])} ${esc(plan.teamGreetingName)} &mdash; Reporting Times</b></p>`);

    // One "card" per distinct call time: a big bold time banner, with every role
    // reporting at that time listed underneath it, so the time reads at a glance
    // and the roster of who's due follows below rather than repeating per row.
    let i = 0;
    while (i < plan.callTimes.length) {
      const label = displayTimeWithMeridiem(plan.callTimes[i].time);
      let j = i;
      while (j < plan.callTimes.length && displayTimeWithMeridiem(plan.callTimes[j].time) === label) j++;
      const roles = plan.callTimes.slice(i, j).map((ct) => ct.label);

      parts.push(
        `<table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;margin:0 0 10px 0;${FONT}">`
      );
      parts.push(
        `<tr><td style="${FONT}background:${CALL_GREEN};color:#ffffff;font-weight:bold;font-size:16pt;text-align:center;padding:8px 12px;border:1px solid ${CALL_GREEN};">${esc(label)}</td></tr>`
      );
      parts.push(
        `<tr><td style="${FONT}background:${CALL_TINT};border:1px solid ${CALL_BORDER};border-top:none;padding:10px 16px;">` +
          `<ul style="${FONT}margin:0;padding:0 0 0 18px;">` +
          roles.map((role) => `<li style="${FONT}padding:2px 0">${esc(role)}</li>`).join("") +
          `</ul></td></tr>`
      );
      parts.push(`</table>`);
      i = j;
    }
    parts.push(`<p style="${FONT}">&nbsp;</p>`);
  }

  if (plan.closingNote) {
    parts.push(`<p style="${FONT}">${esc(plan.closingNote).replace(/\n/g, "<br/>")}</p>`);
  }

  return parts.join("\n");
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
