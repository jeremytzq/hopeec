import type { RosterPerson, WeeklyPlan } from "./types";
import type { CcPerson } from "./defaultCc";
import { DEFAULT_CC_PEOPLE } from "./defaultCc";

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

export function loadPlans(): Record<string, WeeklyPlan> {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : {};
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
