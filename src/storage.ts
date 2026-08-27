import type { RosterPerson, WeeklyPlan } from "./types";
import type { CcPerson } from "./defaultCc";
import { DEFAULT_CC_PEOPLE } from "./defaultCc";
import { deriveShortServiceName, formatLongDate } from "./utils/time";

const ROSTER_KEY = "hopeec.roster.v1";
const PLANS_KEY = "hopeec.plans.v1";
const CC_LIST_KEY = "hopeec.ccList.v1";

export function loadRoster(): RosterPerson[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRoster(roster: RosterPerson[]): void {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

// Seeded from DEFAULT_CC_PEOPLE the first time; edits persist from there on.
export function loadCcList(): CcPerson[] {
  try {
    const raw = localStorage.getItem(CC_LIST_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CC_PEOPLE;
  } catch {
    return DEFAULT_CC_PEOPLE;
  }
}

export function saveCcList(ccList: CcPerson[]): void {
  localStorage.setItem(CC_LIST_KEY, JSON.stringify(ccList));
}

const isPlainText = (s: string) => !/<[a-z][\s\S]*>/i.test(s);

function escapeToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

// Before the rich-text intro note editor, introNote was plain text (often
// hand-wrapped in "**...**" for emphasis) rendered fully bold. Detect that
// shape - no HTML tags - and convert it once into the equivalent HTML so
// old plans keep looking the same in the rich-text editor and the email.
function migrateIntroNote(text: string): string {
  let body = text.trim();
  if (body.startsWith("**") && body.endsWith("**")) body = body.slice(2, -2);
  return `<b>${escapeToHtml(body)}</b>`;
}

export function loadPlans(): Record<string, WeeklyPlan> {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    const plans: Record<string, WeeklyPlan> = raw ? JSON.parse(raw) : {};
    for (const plan of Object.values(plans)) {
      // Backfills plans saved before the emailSubject field existed.
      if (!plan.emailSubject) {
        plan.emailSubject = `[${deriveShortServiceName(plan.serviceName)}] Service Brief for ${formatLongDate(plan.date)}`;
      }
      // Backfills plans saved before introNote/closingNote/action fields became rich-text HTML.
      if (plan.introNote && isPlainText(plan.introNote)) {
        plan.introNote = migrateIntroNote(plan.introNote);
      }
      if (plan.closingNote && isPlainText(plan.closingNote)) {
        plan.closingNote = escapeToHtml(plan.closingNote);
      }
      for (const seg of plan.segments || []) {
        for (const a of seg.assignments || []) {
          if (a.action && isPlainText(a.action)) {
            a.action = escapeToHtml(a.action);
          }
        }
      }
    }
    return plans;
  } catch {
    return {};
  }
}

export function savePlan(plan: WeeklyPlan): void {
  const plans = loadPlans();
  plans[plan.id] = plan;
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function deletePlan(id: string): void {
  const plans = loadPlans();
  delete plans[id];
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function mostRecentPlan(beforeDate?: string): WeeklyPlan | undefined {
  const plans = Object.values(loadPlans()).sort((a, b) => a.date.localeCompare(b.date));
  if (!beforeDate) return plans[plans.length - 1];
  const earlier = plans.filter((p) => p.date < beforeDate);
  return earlier[earlier.length - 1];
}
