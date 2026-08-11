import type { Segment } from "../types";
import { uid } from "../types";
import { chainTimes, displayTime } from "../utils/time";

type Props = {
  segments: Segment[];
  startTime: string;
  onChange: (segments: Segment[]) => void;
  onStartTimeChange: (t: string) => void;
};

export default function SegmentsEditor({ segments, startTime, onChange, onStartTimeChange }: Props) {
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

  return (
    <div className="editor-block">
      <div className="row">
        <label>
          Service start time
          <input type="time" value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} />
        </label>
        <span className="muted">Ends {displayTime(endTime)} &middot; {totalMin} min total</span>
      </div>

      <table className="simple-table segments-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Min</th>
            <th>Programme</th>
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
              <td className="row-actions">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === segments.length - 1}>↓</button>
                <button type="button" className="danger small" onClick={() => remove(seg.id)}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addSegment}>+ Add programme item</button>
    </div>
  );
}
