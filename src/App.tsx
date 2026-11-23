import { useEffect, useMemo, useRef, useState } from "react";
import type { RosterPerson, WeeklyPlan } from "./types";
import type { CcPerson } from "./defaultCc";
import { loadRoster, saveRoster, loadPlans, savePlan, loadCcList, saveCcList } from "./storage";
import PlannerTab, { newPlanForDate } from "./components/PlannerTab";
import RosterTab from "./components/RosterTab";
import { deriveShortServiceName, formatLongDate } from "./utils/time";
import "./App.css";

function nextSunday(): string {
  const d = new Date();
  const day = d.getDay();
  const add = (7 - day) % 7 || 7;
  d.setDate(d.getDate() + (day === 0 && new Date().getHours() < 12 ? 0 : add));
  return d.toISOString().slice(0, 10);
}

function App() {
  const [tab, setTab] = useState<"planner" | "roster">("planner");
  const [roster, setRoster] = useState<RosterPerson[]>([]);
  const [ccList, setCcList] = useState<CcPerson[]>([]);
  const [plansById, setPlansById] = useState<Record<string, WeeklyPlan>>({});
  const [plan, setPlan] = useState<WeeklyPlan>(() => newPlanForDate(nextSunday()));

  const [initialLoadState, setInitialLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [rosterSaveError, setRosterSaveError] = useState<string | null>(null);
  const [ccListSaveError, setCcListSaveError] = useState<string | null>(null);

  // The per-change autosave effects below must not fire for the render where
  // the initial load just populated real data (only for *subsequent* genuine
  // edits). Gating on `initialLoadState === "ready"` - rather than counting
  // effect firings - keeps this correct even under React StrictMode's dev-only
  // double-invoke of effects: every firing while still "loading" exits via the
  // guard below without ever touching these refs, so there's exactly one
  // firing to skip once "ready", no matter how many no-op passes preceded it.
  const skippedFirstReadyRosterSave = useRef(false);
  const skippedFirstReadyCcListSave = useRef(false);

  // Guards the fetch itself against StrictMode's dev-only double-invoke of
  // mount effects, so exactly one set of GET requests fires (matching
  // production) instead of two independently-resolving loads racing to set
  // state with two different (if content-equal) array references.
  const didStartInitialLoad = useRef(false);

  useEffect(() => {
    if (didStartInitialLoad.current) return;
    didStartInitialLoad.current = true;
    (async () => {
      try {
        const [r, c, p] = await Promise.all([loadRoster(), loadCcList(), loadPlans()]);
        setRoster(r);
        setCcList(c);
        setPlansById(p);
        setInitialLoadState("ready");
      } catch {
        setInitialLoadState("error");
      }
    })();
  }, []);

  useEffect(() => {
    if (initialLoadState !== "ready") return;
    if (!skippedFirstReadyRosterSave.current) {
      skippedFirstReadyRosterSave.current = true;
      return;
    }
    setRosterSaveError(null);
    saveRoster(roster).catch(() => setRosterSaveError("Failed to save the roster to the cloud."));
  }, [roster, initialLoadState]);

  useEffect(() => {
    if (initialLoadState !== "ready") return;
    if (!skippedFirstReadyCcListSave.current) {
      skippedFirstReadyCcListSave.current = true;
      return;
    }
    setCcListSaveError(null);
    saveCcList(ccList).catch(() => setCcListSaveError("Failed to save the CC list to the cloud."));
  }, [ccList, initialLoadState]);

  const allDates = useMemo(() => Object.keys(plansById).sort(), [plansById]);

  async function handleSave(): Promise<boolean> {
    try {
      await savePlan(plan);
      setPlansById((prev) => ({ ...prev, [plan.id]: plan }));
      return true;
    } catch {
      return false;
    }
  }

  function handleLoadDate(date: string) {
    const existing = plansById[date];
    setPlan(existing ?? newPlanForDate(date));
  }

  function handleDuplicateFrom(sourceDate: string) {
    const source = plansById[sourceDate];
    if (!source) return;
    setPlan({
      ...source,
      id: plan.date,
      date: plan.date,
      emailSubject: `[${deriveShortServiceName(source.serviceName)}] Service Brief for ${formatLongDate(plan.date)}`,
      sermonTitle: "",
      speaker: "",
      holyCommunion: false,
    });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>EC Service Planner</h1>
        <nav className="tabs">
          <button type="button" className={tab === "planner" ? "active" : ""} onClick={() => setTab("planner")}>
            Weekly Planner
          </button>
          <button type="button" className={tab === "roster" ? "active" : ""} onClick={() => setTab("roster")}>
            Volunteer Roster
          </button>
        </nav>
      </header>

      <main>
        {initialLoadState === "loading" && <p className="loading-placeholder">Loading your data...</p>}
        {initialLoadState === "error" && (
          <p className="status error">
            Couldn't load data from the cloud. <button type="button" onClick={() => window.location.reload()}>Retry</button>
          </p>
        )}
        {initialLoadState === "ready" && (
          <>
            {rosterSaveError && <p className="status error">{rosterSaveError}</p>}
            {ccListSaveError && <p className="status error">{ccListSaveError}</p>}
            {tab === "planner" && (
              <PlannerTab
                plan={plan}
                onChange={setPlan}
                roster={roster}
                ccList={ccList}
                onCcListChange={setCcList}
                allDates={allDates}
                onLoadDate={handleLoadDate}
                onDuplicateFrom={handleDuplicateFrom}
                onSave={handleSave}
              />
            )}
            {tab === "roster" && <RosterTab roster={roster} onChange={setRoster} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
