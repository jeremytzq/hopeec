import { useEffect, useMemo, useState } from "react";
import type { RosterPerson, WeeklyPlan } from "./types";
import { loadRoster, saveRoster, loadPlans, savePlan } from "./storage";
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
  const [plansById, setPlansById] = useState<Record<string, WeeklyPlan>>(() => loadPlans());
  const [plan, setPlan] = useState<WeeklyPlan>(() => {
    const plans = loadPlans();
    const dates = Object.keys(plans).sort();
    const latest = dates[dates.length - 1];
    return latest ? plans[latest] : newPlanForDate(nextSunday());
  });

  useEffect(() => saveRoster(roster), [roster]);

  useEffect(() => {
    savePlan(plan);
    setPlansById((prev) => ({ ...prev, [plan.id]: plan }));
  }, [plan]);

  const allDates = useMemo(() => Object.keys(plansById).sort(), [plansById]);

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
            allDates={allDates}
            onLoadDate={handleLoadDate}
            onDuplicateFrom={handleDuplicateFrom}
          />
        )}
        {tab === "roster" && <RosterTab roster={roster} onChange={setRoster} />}
      </main>
    </div>
  );
}

export default App;
