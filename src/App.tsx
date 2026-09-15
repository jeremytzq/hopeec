import { useEffect, useMemo, useState } from "react";
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
  const [roster, setRoster] = useState<RosterPerson[]>(() => loadRoster());
  const [ccList, setCcList] = useState<CcPerson[]>(() => loadCcList());
  const [plansById, setPlansById] = useState<Record<string, WeeklyPlan>>(() => loadPlans());
  const [plan, setPlan] = useState<WeeklyPlan>(() => newPlanForDate(nextSunday()));

  useEffect(() => saveRoster(roster), [roster]);
  useEffect(() => saveCcList(ccList), [ccList]);

  const allDates = useMemo(() => Object.keys(plansById).sort(), [plansById]);

  function handleSave() {
    savePlan(plan);
    setPlansById((prev) => ({ ...prev, [plan.id]: plan }));
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
      </main>
    </div>
  );
}

export default App;
