import type { RosterPerson, WeeklyPlan } from "./types";

const ROSTER_KEY = "hopeec.roster.v1";
const PLANS_KEY = "hopeec.plans.v1";

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
