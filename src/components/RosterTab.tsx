import { useState } from "react";
import type { RosterPerson } from "../types";
import { uid } from "../types";

type Props = {
  roster: RosterPerson[];
  onChange: (roster: RosterPerson[]) => void;
};

export default function RosterTab({ roster, onChange }: Props) {
  const [pasteText, setPasteText] = useState("");

  function update(id: string, patch: Partial<RosterPerson>) {
    onChange(roster.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function remove(id: string) {
    onChange(roster.filter((p) => p.id !== id));
  }
  function add() {
    onChange([...roster, { id: uid(), name: "", email: "", team: "", active: true }]);
  }

  function importPasted() {
    // Accepts lines of "Name, email@x.com, Team" or "Name <email@x.com> Team" or tab-separated (e.g. pasted from PCO/Excel)
    const lines = pasteText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const newPeople: RosterPerson[] = [];
    for (const line of lines) {
      const parts = line.includes("\t") ? line.split("\t") : line.split(",");
      const trimmed = parts.map((p) => p.trim()).filter(Boolean);
      const emailMatch = line.match(/[^\s<>,]+@[^\s<>,]+/);
      const email = emailMatch ? emailMatch[0] : "";
      const rest = trimmed.filter((p) => p !== email);
      const name = rest[0] || email;
      const team = rest[1] || "";
      if (email || name) newPeople.push({ id: uid(), name, email, team, active: true });
    }
    if (newPeople.length) {
      onChange([...roster, ...newPeople]);
      setPasteText("");
    }
  }

  const recipientsString = roster.filter((p) => p.active).map((p) => p.email).filter(Boolean).join("; ");

  return (
    <div className="editor-block">
      <p className="muted">
        This is your volunteer directory (mirrors what you'd otherwise look up in PCO each week). Add people once, then
        just tick/untick who's serving when you plan each week.
      </p>

      <table className="simple-table">
        <thead>
          <tr><th>Active</th><th>Name</th><th>Email</th><th>Team</th><th></th></tr>
        </thead>
        <tbody>
          {roster.map((p) => (
            <tr key={p.id}>
              <td><input type="checkbox" checked={p.active} onChange={(e) => update(p.id, { active: e.target.checked })} /></td>
              <td><input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} /></td>
              <td><input value={p.email} onChange={(e) => update(p.id, { email: e.target.value })} placeholder="name@example.com" /></td>
              <td><input value={p.team} onChange={(e) => update(p.id, { team: e.target.value })} placeholder="e.g. Worship" /></td>
              <td><button type="button" className="danger small" onClick={() => remove(p.id)}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={add}>+ Add person</button>

      <h3>Bulk import</h3>
      <p className="muted">Paste rows copied from PCO/Excel — one person per line: Name, email, Team (tabs or commas both work).</p>
      <textarea rows={5} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"Jane Tan, jane@example.com, Worship\nJohn Lee, john@example.com, Ushering"} />
      <button type="button" onClick={importPasted} disabled={!pasteText.trim()}>Import pasted rows</button>

      <h3>Active recipients (copy into Outlook's To: field)</h3>
      <textarea readOnly rows={3} value={recipientsString} onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
    </div>
  );
}
