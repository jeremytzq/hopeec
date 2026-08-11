import type { CallTimeItem } from "../types";
import { uid } from "../types";

type Props = {
  items: CallTimeItem[];
  onChange: (items: CallTimeItem[]) => void;
};

export default function CallTimesEditor({ items, onChange }: Props) {
  function update(id: string, patch: Partial<CallTimeItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }
  function add() {
    onChange([...items, { id: uid(), time: "07:00", label: "" }]);
  }

  return (
    <div className="editor-block">
      <table className="simple-table">
        <thead>
          <tr><th>Time</th><th>Team / Role</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td><input type="time" value={it.time} onChange={(e) => update(it.id, { time: e.target.value })} /></td>
              <td><input value={it.label} onChange={(e) => update(it.id, { label: e.target.value })} placeholder="e.g. Worship, Sound" /></td>
              <td><button type="button" className="danger small" onClick={() => remove(it.id)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={add}>+ Add call time</button>
    </div>
  );
}
