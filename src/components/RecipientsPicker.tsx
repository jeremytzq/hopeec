import type { RosterPerson } from "../types";

type Props = {
  roster: RosterPerson[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export default function RecipientsPicker({ roster, selectedIds, onChange }: Props) {
  const selected = new Set(selectedIds);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  function selectAllActive() {
    onChange(roster.filter((p) => p.active).map((p) => p.id));
  }

  const byTeam = new Map<string, RosterPerson[]>();
  for (const p of roster) {
    const key = p.team || "(no team)";
    if (!byTeam.has(key)) byTeam.set(key, []);
    byTeam.get(key)!.push(p);
  }

  return (
    <div className="editor-block">
      <div className="row">
        <button type="button" onClick={selectAllActive}>Select all active</button>
        <button type="button" onClick={() => onChange([])}>Clear</button>
        <span className="muted">{selectedIds.length} selected</span>
      </div>
      {[...byTeam.entries()].map(([team, people]) => (
        <div key={team} className="recipient-group">
          <div className="recipient-group-title">{team}</div>
          {people.map((p) => (
            <label key={p.id} className="inline-check">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
              {p.name} {p.email && <span className="muted">&lt;{p.email}&gt;</span>}
            </label>
          ))}
        </div>
      ))}
      {roster.length === 0 && <p className="muted">No one in your roster yet — add volunteers in the Roster tab.</p>}
    </div>
  );
}
