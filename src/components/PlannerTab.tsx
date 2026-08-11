import { useMemo, useState } from "react";
import type { RosterPerson, Segment, WeeklyPlan } from "../types";
import { blankPlan, uid } from "../types";
import { applyDefaultTemplate } from "../defaultTemplate";
import SegmentsEditor from "./SegmentsEditor";
import RehearsalEditor from "./RehearsalEditor";
import CallTimesEditor from "./CallTimesEditor";
import RecipientsPicker from "./RecipientsPicker";
import { downloadServiceBriefPdf } from "../pdf";
import { buildEmailHtml, buildEmailSubject, buildRecipientsString, copyEmailToClipboard } from "../email";
import { buildPastorSummary, copyToClipboardText } from "../whatsapp";
import { copyProgramImageToClipboard, downloadProgramImage } from "../screenshot";

type Props = {
  plan: WeeklyPlan;
  onChange: (plan: WeeklyPlan) => void;
  roster: RosterPerson[];
  allDates: string[];
  onLoadDate: (date: string) => void;
  onDuplicateFrom: (sourceDate: string) => void;
};

export default function PlannerTab({ plan, onChange, roster, allDates, onLoadDate, onDuplicateFrom }: Props) {
  const [copyStatus, setCopyStatus] = useState("");
  const [newTeam, setNewTeam] = useState("");

  function set<K extends keyof WeeklyPlan>(key: K, value: WeeklyPlan[K]) {
    onChange({ ...plan, [key]: value });
  }

  function addTeam() {
    const name = newTeam.trim();
    if (!name || plan.teams.includes(name)) return;
    set("teams", [...plan.teams, name]);
    setNewTeam("");
  }

  function removeTeam(team: string) {
    set(
      "teams",
      plan.teams.filter((t) => t !== team)
    );
  }

  const emailHtml = useMemo(() => buildEmailHtml(plan), [plan]);
  const recipientsString = useMemo(() => buildRecipientsString(plan, roster), [plan, roster]);
  const pastorSummary = useMemo(() => buildPastorSummary(plan), [plan]);

  function handleLoadDefault() {
    const hasContent = plan.segments.length > 0 || plan.rehearsal.length > 0 || plan.callTimes.length > 0;
    if (hasContent && !confirm("This replaces the order of service, rehearsal schedule, call times, and teams with the standard template. Sermon title, speaker, and recipients are kept. Continue?")) {
      return;
    }
    onChange(applyDefaultTemplate(plan));
  }

  function handleHolyCommunionChange(checked: boolean) {
    const isHc = (program: string) => program.toLowerCase().includes("holy communion");
    const hasHc = plan.segments.some((s) => isHc(s.program));
    let segments = plan.segments;

    if (checked && !hasHc) {
      const hcSegment: Segment = {
        id: uid(),
        program: "Holy Communion (Live)",
        durationMin: 2,
        assignments: [
          { id: uid(), team: "Service Leaders", action: "To lead in Holy Communion." },
          { id: uid(), team: "SM and MM Teams", action: "" },
        ],
      };
      const closeWorshipIdx = segments.findIndex((s) => s.program.toLowerCase().includes("close worship"));
      const welcomeIdx = segments.findIndex((s) => s.program.toLowerCase().includes("welcome"));
      const insertAt = closeWorshipIdx >= 0 ? closeWorshipIdx + 1 : welcomeIdx >= 0 ? welcomeIdx : segments.length;
      segments = [...segments.slice(0, insertAt), hcSegment, ...segments.slice(insertAt)];
    } else if (!checked && hasHc) {
      segments = segments.filter((s) => !isHc(s.program));
    }

    onChange({ ...plan, holyCommunion: checked, segments });
  }

  async function handleCopyEmail() {
    try {
      await copyEmailToClipboard(plan);
      setCopyStatus("Email copied — paste into Outlook.");
    } catch {
      setCopyStatus("Clipboard copy failed — select the preview below and copy manually.");
    }
    setTimeout(() => setCopyStatus(""), 4000);
  }

  async function handleCopyRecipients() {
    await copyToClipboardText(recipientsString);
    setCopyStatus("Recipients copied — paste into Outlook's To: field.");
    setTimeout(() => setCopyStatus(""), 4000);
  }

  async function handleCopyWhatsapp() {
    await copyToClipboardText(pastorSummary);
    setCopyStatus("Message copied — paste into WhatsApp for your pastor.");
    setTimeout(() => setCopyStatus(""), 4000);
  }

  async function handleDownloadProgramImage() {
    await downloadProgramImage(plan);
    setCopyStatus("Program image downloaded — attach it in WhatsApp.");
    setTimeout(() => setCopyStatus(""), 4000);
  }

  async function handleCopyProgramImage() {
    try {
      await copyProgramImageToClipboard(plan);
      setCopyStatus("Program image copied — paste into WhatsApp.");
    } catch {
      setCopyStatus("Clipboard copy failed — use \"Download program image\" and attach it instead.");
    }
    setTimeout(() => setCopyStatus(""), 4000);
  }

  return (
    <div>
      <div className="editor-block">
        <div className="row wrap">
          <label>
            Week (date)
            <input
              type="date"
              value={plan.date}
              onChange={(e) => {
                const date = e.target.value;
                onChange({ ...plan, id: date, date });
              }}
            />
          </label>
          <label>
            Load a saved week
            <select value="" onChange={(e) => e.target.value && onLoadDate(e.target.value)}>
              <option value="">-- select --</option>
              {allDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Duplicate from
            <select value="" onChange={(e) => e.target.value && onDuplicateFrom(e.target.value)}>
              <option value="">-- select a past week --</option>
              {allDates.filter((d) => d !== plan.date).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            &nbsp;
            <button type="button" onClick={handleLoadDefault}>Load default program</button>
          </label>
        </div>
      </div>

      <h2 className="h-details">Service details</h2>
      <div className="editor-block">
        <div className="row wrap">
          <label>
            Service name
            <input value={plan.serviceName} onChange={(e) => set("serviceName", e.target.value)} />
          </label>
          <label>
            Team greeting name (email "Hi ___,")
            <input value={plan.teamGreetingName} onChange={(e) => set("teamGreetingName", e.target.value)} />
          </label>
          <label>
            Service time (shown in email's "Services" column)
            <input type="time" value={plan.serviceClockTime} onChange={(e) => set("serviceClockTime", e.target.value)} />
          </label>
          <label className="inline-check">
            <input type="checkbox" checked={plan.holyCommunion} onChange={(e) => handleHolyCommunionChange(e.target.checked)} />
            Holy Communion this week
          </label>
        </div>
        <div className="row wrap">
          <label>
            Sermon title
            <input value={plan.sermonTitle} onChange={(e) => set("sermonTitle", e.target.value)} placeholder="From the EC Ops / Overview sheet" />
          </label>
          <label>
            Speaker
            <input value={plan.speaker} onChange={(e) => set("speaker", e.target.value)} />
          </label>
        </div>
        <label>
          Intro note (bold instruction line in the email)
          <textarea rows={4} value={plan.introNote} onChange={(e) => set("introNote", e.target.value)} />
        </label>
        <label>
          Closing note
          <textarea rows={2} value={plan.closingNote} onChange={(e) => set("closingNote", e.target.value)} />
        </label>
      </div>

      <h2 className="h-teams">Teams (for the email's per-team tables)</h2>
      <div className="editor-block">
        <div className="row wrap">
          {plan.teams.map((t) => (
            <span className="chip" key={t}>
              {t} <button type="button" className="danger small" onClick={() => removeTeam(t)}>✕</button>
            </span>
          ))}
        </div>
        <div className="row">
          <input value={newTeam} onChange={(e) => setNewTeam(e.target.value)} placeholder="e.g. Ushering Team" />
          <button type="button" onClick={addTeam}>+ Add team</button>
        </div>
      </div>

      <div className="two-col">
        <div>
          <h2 className="h-order">Order of service</h2>
          <SegmentsEditor
            segments={plan.segments}
            startTime={plan.startTime}
            teams={plan.teams}
            onChange={(segments) => set("segments", segments)}
            onStartTimeChange={(t) => set("startTime", t)}
          />
        </div>
        <div>
          <h2 className="h-rehearsal">Rehearsal schedule</h2>
          <RehearsalEditor
            items={plan.rehearsal}
            startTime={plan.rehearsalStartTime}
            onChange={(rehearsal) => set("rehearsal", rehearsal)}
            onStartTimeChange={(t) => set("rehearsalStartTime", t)}
          />
        </div>
      </div>

      <div className="two-col">
        <div>
          <h2 className="h-calltimes">Call times</h2>
          <CallTimesEditor items={plan.callTimes} onChange={(callTimes) => set("callTimes", callTimes)} />
        </div>
        <div>
          <h2 className="h-recipients">Recipients this week</h2>
          <RecipientsPicker roster={roster} selectedIds={plan.recipientIds} onChange={(ids) => set("recipientIds", ids)} />
        </div>
      </div>

      <h2 className="h-send">Send it out</h2>
      <div className="editor-block">
        <div className="row wrap">
          <button type="button" onClick={() => downloadServiceBriefPdf(plan)}>Download Service Brief PDF</button>
          <button type="button" onClick={handleCopyEmail}>Copy email (for Outlook)</button>
          <button type="button" onClick={handleCopyRecipients}>Copy recipient list</button>
          <button type="button" onClick={handleCopyWhatsapp}>Copy pastor message (WhatsApp)</button>
          <button type="button" onClick={handleCopyProgramImage}>Copy program image (WhatsApp)</button>
          <button type="button" onClick={handleDownloadProgramImage}>Download program image</button>
        </div>
        {copyStatus && <p className="status">{copyStatus}</p>}
        <p className="muted">Subject line: {buildEmailSubject(plan)}</p>

        <details>
          <summary>Preview email</summary>
          <div className="email-preview" dangerouslySetInnerHTML={{ __html: emailHtml }} />
        </details>
        <details>
          <summary>Preview WhatsApp summary for pastor</summary>
          <pre className="whatsapp-preview">{pastorSummary}</pre>
        </details>
      </div>
    </div>
  );
}

export function newPlanForDate(date: string): WeeklyPlan {
  return blankPlan(date);
}
