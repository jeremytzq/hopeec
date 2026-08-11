import { useState } from "react";
import type { RosterPerson } from "../types";

type Props = {
  roster: RosterPerson[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function RecipientsPicker({ roster, selectedIds, onChange }: Props) {
  const [query, setQuery] = useState("");
  const selected = new Set(selectedIds);

  function add(id: string) {
    if (selected.has(id)) return;
    onChange([...selectedIds, id]);
  }

  function remove(id: string) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  function selectAllActive() {
    onChange(roster.filter((p) => p.active).map((p) => p.id));
  }

  const q = query.trim().toLowerCase();
  const results = q ? roster.filter((p) => p.name.toLowerCase().includes(q)) : [];
  const selectedPeople = roster.filter((p) => selected.has(p.id));

  return (
    <div className="editor-block">
      <div className="row">
        <button type="button" onClick={selectAllActive}>Select all active</button>
        <button type="button" onClick={() => onChange([])}>Clear</button>
        <span className="muted">{selectedIds.length} selected</span>
      </div>

      <input
        className="recipient-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search volunteer roster by name…"
      />
      {q && results.length === 0 && <p className="muted">No one in the roster matches "{query}".</p>}
      {q && results.length > 0 && (
        <div className="recipient-group">
          {results.map((p) => (
            <label key={p.id} className="inline-check">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => (selected.has(p.id) ? remove(p.id) : add(p.id))} />
              {p.name} {p.email && <span className="muted">&lt;{p.email}&gt;</span>}
            </label>
          ))}
        </div>
      )}

      <div className="recipient-group-title">Added this week ({selectedPeople.length})</div>
      {selectedPeople.length === 0 && (
        <p className="muted">No one added yet — search above and tick a name to add them.</p>
      )}
      {selectedPeople.map((p) => (
        <div key={p.id} className="recipient-row">
          <span>{p.name} {p.email && <span className="muted">&lt;{p.email}&gt;</span>}</span>
          <button type="button" className="danger small" onClick={() => remove(p.id)}>✕</button>
        </div>
      ))}

      {roster.length === 0 && <p className="muted">No one in your roster yet — add volunteers in the Roster tab.</p>}
    </div>
  );
}
