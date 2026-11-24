import type { RosterPerson, WeeklyPlan } from "./types";
import type { CcPerson } from "./defaultCc";
import { DEFAULT_CC_PEOPLE } from "./defaultCc";
import { deriveShortServiceName, formatLongDate } from "./utils/time";

const ROSTER_KEY = "hopeec.roster.v1";
const PLANS_KEY = "hopeec.plans.v1";
const CC_LIST_KEY = "hopeec.ccList.v1";

function readLocalArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Shared, no-login cloud store (see api/*.ts): every browser reads/writes the
// same data, with localStorage kept only as a write-through cache so the app
// still works - read-only, from whatever was last fetched - if the network or
// the cloud store is unavailable.
//
// On the FIRST successful cloud fetch after this app started storing data in
// the cloud, the cloud collection can legitimately be empty while this browser's
// local cache still holds real, never-yet-migrated data (nothing was ever PUT/
// POSTed to seed it). Blindly trusting "cloud responded OK" and overwriting the
// local cache with that emptiness destroys that data. So: an empty cloud result
// is only treated as authoritative when the local cache is ALSO empty; if local
// has data the cloud doesn't, that local data is pushed up to seed the cloud
// store instead of being discarded.
export async function loadRoster(): Promise<RosterPerson[]> {
  try {
    const res = await fetch("/api/roster");
    if (!res.ok) throw new Error(`GET /api/roster failed (${res.status})`);
    const { roster } = await res.json();
    const local = readLocalArray<RosterPerson>(ROSTER_KEY);
    if (roster.length === 0 && local.length > 0) {
      await saveRoster(local);
      return local;
    }
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    return roster;
  } catch {
    return readLocalArray<RosterPerson>(ROSTER_KEY);
  }
}

export async function saveRoster(roster: RosterPerson[]): Promise<void> {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  const res = await fetch("/api/roster", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roster }),
  });
  if (!res.ok) throw new Error("Failed to save roster to the cloud.");
}

// Seeded from DEFAULT_CC_PEOPLE the first time; edits persist from there on.
export async function loadCcList(): Promise<CcPerson[]> {
  try {
    const res = await fetch("/api/cc-list");
    if (!res.ok) throw new Error(`GET /api/cc-list failed (${res.status})`);
    const { ccList } = await res.json();
    const local = readLocalArray<CcPerson>(CC_LIST_KEY);
    if (ccList.length === 0 && local.length > 0) {
      await saveCcList(local);
      return local;
    }
    const list = ccList.length > 0 ? ccList : DEFAULT_CC_PEOPLE;
    localStorage.setItem(CC_LIST_KEY, JSON.stringify(list));
    return list;
  } catch {
    const cached = readLocalArray<CcPerson>(CC_LIST_KEY);
    return cached.length > 0 ? cached : DEFAULT_CC_PEOPLE;
  }
}

export async function saveCcList(ccList: CcPerson[]): Promise<void> {
  localStorage.setItem(CC_LIST_KEY, JSON.stringify(ccList));
  const res = await fetch("/api/cc-list", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ccList }),
  });
  if (!res.ok) throw new Error("Failed to save CC list to the cloud.");
}

// A string counts as "already migrated" if it has an HTML tag, OR already
// contains an HTML entity (&amp; &lt; etc) - the latter check matters because
// escapeToHtml() itself produces entities with no tags, and without it a
// plain-text field with an ampersand would get re-escaped every single time
// loadPlans() runs, doubling "&" into "&amp;amp;amp;..." within a few saves.
const isPlainText = (s: string) => !/<[a-z][\s\S]*>/i.test(s) && !/&(?:amp|lt|gt|nbsp|#\d+|#x[0-9a-f]+);/i.test(s);

function escapeToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

// One-time repair for data already corrupted by the bug above: a chain like
// "&amp;amp;amp;...;" is what N re-escapes of a single "&" looks like (each
// pass wraps the existing leading "&" in one more "amp;"). Collapses any such
// chain back down to a single correctly-escaped "&amp;" - leaves an already-
// correct lone "&amp;" untouched, since it requires 2+ repeated "amp;" groups.
function repairDoubleEscapedAmp(s: string): string {
  return s.replace(/&(?:amp;){2,}/gi, "&amp;");
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

// Runs the one-time field migrations/repairs over a freshly-loaded plans
// object, in place. Pulled out of loadPlans() so it applies identically
// whether the raw data came from the cloud or the localStorage fallback.
function migratePlansInPlace(plans: Record<string, WeeklyPlan>): Record<string, WeeklyPlan> {
  for (const plan of Object.values(plans)) {
    // Backfills plans saved before the emailSubject field existed.
    if (!plan.emailSubject) {
      plan.emailSubject = `[${deriveShortServiceName(plan.serviceName)}] Service Brief for ${formatLongDate(plan.date)}`;
    }
    // Backfills plans saved before introNote/closingNote/action fields became rich-text HTML.
    if (plan.introNote && isPlainText(plan.introNote)) {
      plan.introNote = migrateIntroNote(plan.introNote);
    } else if (plan.introNote) {
      plan.introNote = repairDoubleEscapedAmp(plan.introNote);
    }
    if (plan.closingNote && isPlainText(plan.closingNote)) {
      plan.closingNote = escapeToHtml(plan.closingNote);
    } else if (plan.closingNote) {
      plan.closingNote = repairDoubleEscapedAmp(plan.closingNote);
    }
    for (const seg of plan.segments || []) {
      for (const a of seg.assignments || []) {
        if (a.action && isPlainText(a.action)) {
          a.action = escapeToHtml(a.action);
        } else if (a.action) {
          a.action = repairDoubleEscapedAmp(a.action);
        }
      }
    }
  }
  return plans;
}

function readLocalPlansRaw(): Record<string, WeeklyPlan> {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function loadPlans(): Promise<Record<string, WeeklyPlan>> {
  try {
    const res = await fetch("/api/plans");
    if (!res.ok) throw new Error(`GET /api/plans failed (${res.status})`);
    const { plans } = await res.json();
    const localRaw = readLocalPlansRaw();
    if (Object.keys(plans).length === 0 && Object.keys(localRaw).length > 0) {
      // Cloud is empty but this browser has real, never-yet-migrated plans -
      // push each one up to seed the cloud store instead of discarding them.
      for (const plan of Object.values(localRaw)) {
        await savePlan(plan);
      }
      return migratePlansInPlace(localRaw);
    }
    // Cache the raw (pre-migration) shape, matching what's actually stored.
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
    return migratePlansInPlace(plans);
  } catch {
    return migratePlansInPlace(readLocalPlansRaw());
  }
}

export async function savePlan(plan: WeeklyPlan): Promise<void> {
  const res = await fetch("/api/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) throw new Error("Failed to save this week's plan to the cloud.");
  try {
    const raw = readLocalPlansRaw();
    raw[plan.id] = plan;
    localStorage.setItem(PLANS_KEY, JSON.stringify(raw));
  } catch {
    // Local cache write is best-effort only - the cloud save above already succeeded.
  }
}

export async function deletePlan(id: string): Promise<void> {
  const res = await fetch(`/api/plans?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete this plan from the cloud.");
  try {
    const raw = readLocalPlansRaw();
    delete raw[id];
    localStorage.setItem(PLANS_KEY, JSON.stringify(raw));
  } catch {
    // Local cache write is best-effort only - the cloud delete above already succeeded.
  }
}

export async function mostRecentPlan(beforeDate?: string): Promise<WeeklyPlan | undefined> {
  const plans = Object.values(await loadPlans()).sort((a, b) => a.date.localeCompare(b.date));
  if (!beforeDate) return plans[plans.length - 1];
  const earlier = plans.filter((p) => p.date < beforeDate);
  return earlier[earlier.length - 1];
}
