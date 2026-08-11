// Minimal delimited-text parser (comma or tab, with quoted-field support per RFC4180)
// so real PCO CSV exports and copy-pasted table rows both parse correctly.
export function parseDelimited(text: string): string[][] {
  const delimiter = text.includes("\t") ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // skip; \n (below) closes the row
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const EMAIL_HEADERS = ["email", "e-mail", "email address"];
const TEAM_HEADERS = ["team", "position", "role", "ministry", "service team", "department"];
const NAME_HEADERS = ["name", "full name", "volunteer"];

export type ParsedPerson = { name: string; email: string; team: string };

export function parseRosterRows(text: string): ParsedPerson[] {
  const rows = parseDelimited(text);
  if (!rows.length) return [];

  const header = rows[0].map((c) => c.trim().toLowerCase());
  const emailIdx = header.findIndex((h) => EMAIL_HEADERS.some((a) => h.includes(a)));
  const isHeaderRow = emailIdx !== -1 || header.some((h) => NAME_HEADERS.some((a) => h.includes(a)));

  if (!isHeaderRow) {
    // No recognizable header: treat every line positionally, same as a quick paste
    // of "Name, email, Team" rows.
    return rows
      .map((cols) => positionalRow(cols))
      .filter((p): p is ParsedPerson => p !== null);
  }

  const teamIdx = header.findIndex((h) => TEAM_HEADERS.some((a) => h.includes(a)));
  const firstIdx = header.findIndex((h) => h.includes("first"));
  const lastIdx = header.findIndex((h) => h.includes("last"));
  const nameIdx = firstIdx === -1 ? header.findIndex((h) => NAME_HEADERS.some((a) => h.includes(a))) : -1;

  const people: ParsedPerson[] = [];
  for (const cols of rows.slice(1)) {
    const trimmed = cols.map((c) => c.trim());
    let email = emailIdx >= 0 ? trimmed[emailIdx] ?? "" : "";
    if (!email) {
      const m = cols.join(" ").match(/[^\s<>,]+@[^\s<>,]+/);
      email = m ? m[0] : "";
    }
    let name: string;
    if (firstIdx >= 0 || lastIdx >= 0) {
      name = [firstIdx >= 0 ? trimmed[firstIdx] : "", lastIdx >= 0 ? trimmed[lastIdx] : ""].filter(Boolean).join(" ");
    } else if (nameIdx >= 0) {
      name = trimmed[nameIdx] ?? "";
    } else {
      name = trimmed.find((c) => c && c !== email) ?? email;
    }
    const team = teamIdx >= 0 ? trimmed[teamIdx] ?? "" : "";
    if (email || name) people.push({ name: name || email, email, team });
  }
  return people;
}

function positionalRow(cols: string[]): ParsedPerson | null {
  const trimmed = cols.map((c) => c.trim()).filter(Boolean);
  if (!trimmed.length) return null;
  const line = cols.join(" ");
  const emailMatch = line.match(/[^\s<>,]+@[^\s<>,]+/);
  const email = emailMatch ? emailMatch[0] : "";
  const rest = trimmed.filter((c) => c !== email);
  const name = rest[0] || email;
  const team = rest[1] || "";
  if (!email && !name) return null;
  return { name, email, team };
}
