import type { WeeklyPlan } from "./types";
import { chainTimes, displayTime, formatDuration } from "./utils/time";

export function buildPastorSummary(plan: WeeklyPlan): string {
  const { times } = chainTimes(plan.startTime, plan.segments);
  const lines: string[] = [];
  lines.push(`Hi Pastor, here's the plan for ${plan.date} (${plan.serviceName}) — could you please check before I send it out?`);
  lines.push("");
  lines.push(`Sermon: ${plan.sermonTitle || "(tbc)"}`);
  lines.push(`Speaker: ${plan.speaker || "(tbc)"}`);
  lines.push(`Holy Communion: ${plan.holyCommunion ? "Yes" : "No"}`);
  lines.push("");
  lines.push("Order of Service:");
  plan.segments.forEach((seg, i) => {
    lines.push(`${displayTime(times[i])} (${formatDuration(seg.durationMin)}) - ${seg.program}`);
  });
  if (plan.closingNote) {
    lines.push("");
    lines.push(plan.closingNote);
  }
  lines.push("");
  lines.push("Thank you!");
  return lines.join("\n");
}

export async function copyToClipboardText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
