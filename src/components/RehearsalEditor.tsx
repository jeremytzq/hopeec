import type { RehearsalItem } from "../types";
import { uid } from "../types";
import { chainTimes, displayTime } from "../utils/time";

type Props = {
  items: RehearsalItem[];
  startTime: string;
  onChange: (items: RehearsalItem[]) => void;
  onStartTimeChange: (t: string) => void;
};

export default function RehearsalEditor({ items, startTime, onChange, onStartTimeChange }: Props) {
  const { times } = chainTimes(startTime, items);

  function update(id: string, patch: Partial<RehearsalItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }
  function add() {
    onChange([...items, { id: uid(), program: "", durationMin: 5 }]);
  }

  return (
    <div className="editor-block">
      <div className="row">
        <label>
          Rehearsal start time
          <input type="time" value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} />
        </label>
      </div>
      <table className="simple-table rehearsal-table">
        <thead>
          <tr><th>Time</th><th>Duration</th><th>Programme</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id}>
              <td className="time-cell">{displayTime(it.fixedTime ?? times[i])}</td>
              <td>
                <div className="duration-cell">
                  {!it.noDuration && (
                    <input className="duration-input" type="number" min={0} value={it.durationMin} onChange={(e) => update(it.id, { durationMin: parseInt(e.target.value, 10) || 0 })} />
                  )}
                  <label className="inline-check small">
                    <input type="checkbox" checked={!!it.noDuration} onChange={(e) => update(it.id, { noDuration: e.target.checked })} />
                    no duration
                  </label>
                </div>
              </td>
              <td><input value={it.program} onChange={(e) => update(it.id, { program: e.target.value })} placeholder="e.g. Soundcheck - Vocalists" /></td>
              <td className="actions-cell">
                <div className="row-actions">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
                  <button type="button" className="danger small" onClick={() => remove(it.id)}>✕</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={add}>+ Add rehearsal item</button>
    </div>
  );
}
