import type { Segment, TeamAssignment } from "../types";
import { uid } from "../types";
import { chainTimes, displayTime } from "../utils/time";
import { RichTextEditor } from "./RichTextEditor";

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

      <div className="table-scroll">
        <table className="simple-table segments-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Min</th>
              <th>Programme</th>
              <th>Team assignments</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg, i) => (
              <tr key={seg.id}>
                <td className="time-cell">{displayTime(times[i])}</td>
                <td>
                  <input
                    className="duration-input"
                    type="number"
                    min={0}
                    value={seg.durationMin}
                    onChange={(e) => update(seg.id, { durationMin: parseInt(e.target.value, 10) || 0 })}
                  />
                </td>
                <td>
                  <input
                    className="program-input"
                    placeholder="e.g. Praise & Worship (Live)"
                    value={seg.program}
                    onChange={(e) => update(seg.id, { program: e.target.value })}
                  />
                </td>
                <td>
                  {seg.assignments.map((a) => (
                    <div className="assignment-row" key={a.id}>
                      <select value={a.team} onChange={(e) => updateAssignment(seg.id, a.id, { team: e.target.value })}>
                        {teams.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <RichTextEditor
                        compact
                        placeholder="Action required"
                        value={a.action}
                        onChange={(html) => updateAssignment(seg.id, a.id, { action: html })}
                      />
                      <button type="button" className="danger small" onClick={() => removeAssignment(seg.id, a.id)}>✕</button>
                    </div>
                  ))}
                  <button type="button" className="link small" onClick={() => addAssignment(seg.id)}>+ assign a team</button>
                </td>
                <td className="actions-cell">
                  <div className="row-actions">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === segments.length - 1}>↓</button>
                    <button type="button" className="danger small" onClick={() => remove(seg.id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addSegment}>+ Add programme item</button>
    </div>
  );
}
