import { useState } from "react";
import type { CallTimeItem } from "../types";
import { uid } from "../types";

type Props = {
  items: CallTimeItem[];
  onChange: (items: CallTimeItem[]) => void;
};

function sortByTime(items: CallTimeItem[]): CallTimeItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

export default function CallTimesEditor({ items, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Editing a time re-sorts the list; dragging (below) reorders it manually
  // and isn't re-sorted unless a time is edited again afterward.
  function update(id: string, patch: Partial<CallTimeItem>) {
    const next = items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    onChange(patch.time !== undefined ? sortByTime(next) : next);
  }

  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }

  function add() {
    onChange(sortByTime([...items, { id: uid(), time: "07:00", label: "" }]));
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="editor-block">
      <table className="simple-table">
        <thead>
          <tr><th></th><th>Time</th><th>Team / Role</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr
              key={it.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                if (overIndex !== i) setOverIndex(i);
              }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={[dragIndex === i && "dragging", overIndex === i && dragIndex !== i && "drag-over"].filter(Boolean).join(" ") || undefined}
            >
              <td className="drag-handle" title="Drag to reorder">⠿</td>
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
