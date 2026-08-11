import { useRef, useState } from "react";
import type { RosterPerson } from "../types";
import { uid } from "../types";
import { parseRosterRows, type ParsedPerson } from "../csv";

type Props = {
  roster: RosterPerson[];
  onChange: (roster: RosterPerson[]) => void;
};

export default function RosterTab({ roster, onChange }: Props) {
  const [pasteText, setPasteText] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function update(id: string, patch: Partial<RosterPerson>) {
    onChange(roster.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function remove(id: string) {
    onChange(roster.filter((p) => p.id !== id));
  }
  function add() {
    onChange([...roster, { id: uid(), name: "", email: "", team: "", active: true }]);
  }

  // Existing people are matched by email (case-insensitive) and updated in place
  // rather than duplicated, so re-importing the same PCO export each week is safe.
  function mergeImported(people: ParsedPerson[]) {
    if (!people.length) {
      setImportStatus("No rows recognized in that import.");
      return;
    }
    let next = [...roster];
    let added = 0;
    let updated = 0;
    for (const p of people) {
      const key = p.email.trim().toLowerCase();
      const existingIdx = key ? next.findIndex((r) => r.email.trim().toLowerCase() === key) : -1;
      if (existingIdx >= 0) {
        next[existingIdx] = {
          ...next[existingIdx],
          name: p.name || next[existingIdx].name,
          team: p.team || next[existingIdx].team,
        };
        updated++;
      } else {
        next.push({ id: uid(), name: p.name, email: p.email, team: p.team, active: true });
        added++;
      }
    }
    onChange(next);
    setImportStatus(`Imported: ${added} added, ${updated} updated.`);
    setTimeout(() => setImportStatus(""), 5000);
  }

  function importPasted() {
    mergeImported(parseRosterRows(pasteText));
    setPasteText("");
  }

  async function importFile(file: File) {
    const text = await file.text();
    mergeImported(parseRosterRows(text));
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      <p className="muted">
        Upload a .csv exported from PCO (People or a plan's Team Members export), or paste rows copied from a PCO/Excel
        table. Headers like Name/Email/Team are detected automatically; without headers it reads Name, Email, Team per
        line. Re-importing is safe — people are matched by email and updated, not duplicated.
      </p>
      <div className="row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv"
          onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])}
        />
      </div>
      <textarea rows={5} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"Jane Tan, jane@example.com, Worship\nJohn Lee, john@example.com, Ushering"} />
      <button type="button" onClick={importPasted} disabled={!pasteText.trim()}>Import pasted rows</button>
      {importStatus && <p className="status">{importStatus}</p>}

      <h3>Active recipients (copy into Outlook's To: field)</h3>
      <textarea readOnly rows={3} value={recipientsString} onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
    </div>
  );
}
