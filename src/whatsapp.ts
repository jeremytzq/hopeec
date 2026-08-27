import type { WeeklyPlan } from "./types";
import { richTextToPlainText } from "./utils/richText";

// The order of service itself is sent as a table screenshot (see screenshot.ts)
// rather than typed out here, since WhatsApp doesn't render tab/column alignment.
export function buildPastorSummary(plan: WeeklyPlan): string {
  const lines: string[] = [];
  lines.push(`Hi Pastor, here's the plan for ${plan.date} (${plan.serviceName}) — could you please check before I send it out?`);
  lines.push("");
  lines.push(`Sermon: ${plan.sermonTitle || "(tbc)"}`);
  lines.push(`Speaker: ${plan.speaker || "(tbc)"}`);
  lines.push(`Holy Communion: ${plan.holyCommunion ? "Yes" : "No"}`);
  lines.push("");
  lines.push("(Program attached as an image)");
  if (plan.closingNote) {
    lines.push("");
    lines.push(richTextToPlainText(plan.closingNote));
  }
  lines.push("");
  lines.push("Thank you!");
  return lines.join("\n");
}

export async function copyToClipboardText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
