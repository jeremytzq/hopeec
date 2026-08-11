import type { Segment, TeamAssignment } from "../types";
import { uid } from "../types";
import { chainTimes, displayTime } from "../utils/time";

type Props = {
  segments: Segment[];
  startTime: string;
  teams: string[];
  onChange: (segments: Segment[]) => void;
  onStartTimeChange: (t: string) => void;
};

export default function SegmentsEditor({ segments, startTime, teams, onChange, onStartTimeChange }: Props) {
  const { times, endTime } = chainTimes(startTime, segments);
  const totalMin = segments.reduce((s, seg) => s + seg.durationMin, 0);

  function update(id: string, patch: Partial<Segment>) {
    onChange(segments.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...segments];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(id: string) {
    onChange(segments.filter((s) => s.id !== id));
  }

  function addSegment() {
    onChange([...segments, { id: uid(), program: "", durationMin: 5, assignments: [] }]);
  }

  function addAssignment(segId: string) {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    const assignment: TeamAssignment = { id: uid(), team: teams[0] || "", action: "" };
    update(segId, { assignments: [...seg.assignments, assignment] });
  }

  function updateAssignment(segId: string, assignmentId: string, patch: Partial<TeamAssignment>) {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    update(segId, {
      assignments: seg.assignments.map((a) => (a.id === assignmentId ? { ...a, ...patch } : a)),
    });
  }

  function removeAssignment(segId: string, assignmentId: string) {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    update(segId, { assignments: seg.assignments.filter((a) => a.id !== assignmentId) });
  }

  return (
    <div className="editor-block">
      <div className="row">
        <label>
          Service start time
          <input type="time" value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} />
        </label>
        <span className="muted">Ends {displayTime(endTime)} &middot; {totalMin} min total</span>
      </div>

      {segments.map((seg, i) => (
        <div className="segment-card" key={seg.id}>
          <div className="segment-header">
            <span className="time-badge">{displayTime(seg.fixedTime ?? times[i])}</span>
            <input
              className="program-input"
              placeholder="Programme item (e.g. Praise & Worship (Live))"
              value={seg.program}
              onChange={(e) => update(seg.id, { program: e.target.value })}
            />
            <input
              className="duration-input"
              type="number"
              min={0}
              value={seg.durationMin}
              onChange={(e) => update(seg.id, { durationMin: parseInt(e.target.value, 10) || 0 })}
              title="Duration (minutes)"
            />
            <span className="muted">min</span>
            <div className="segment-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === segments.length - 1}>↓</button>
              <button type="button" className="danger" onClick={() => remove(seg.id)}>Remove</button>
            </div>
          </div>

          <details className="fixed-time-toggle">
            <summary>Pin exact time (optional)</summary>
            <input
              type="time"
              value={seg.fixedTime ?? ""}
              onChange={(e) => update(seg.id, { fixedTime: e.target.value || undefined })}
            />
            <span className="muted">Leave blank to auto-chain from the previous item</span>
          </details>

          <div className="assignments">
            {seg.assignments.map((a) => (
              <div className="assignment-row" key={a.id}>
                <select value={a.team} onChange={(e) => updateAssignment(seg.id, a.id, { team: e.target.value })}>
                  {teams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  placeholder="Action required (shown in the email)"
                  value={a.action}
                  onChange={(e) => updateAssignment(seg.id, a.id, { action: e.target.value })}
                />
                <button type="button" className="danger small" onClick={() => removeAssignment(seg.id, a.id)}>✕</button>
              </div>
            ))}
            <button type="button" className="link" onClick={() => addAssignment(seg.id)}>+ assign to a team (for the email)</button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addSegment}>+ Add programme item</button>
    </div>
  );
}
