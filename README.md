# EC Service Planner

A single-page web app that replaces the weekly "Excel table → export PDF → copy into
an email template → look up volunteer emails" routine with one screen.

## What it does

You fill in **one** weekly plan (date, sermon/speaker, order of service, rehearsal
schedule, call times, who's serving), and the app generates:

- **Service Brief PDF** — the two-table order-of-service + rehearsal layout, ready to
  download and share.
- **Email** — the overview table, per-team "Programme / Action Required" tables, and
  call-time list, built from the same data. Click **Copy email** and paste directly
  into Outlook (it copies as rich text, so the tables keep their formatting).
- **Recipient list** — tick who's serving this week from your saved volunteer roster,
  click **Copy recipient list**, and paste into Outlook's To: field.
- **Pastor WhatsApp summary** — a plain-text summary of the week's plan, ready to paste
  into WhatsApp for a quick check before you send the email out.

Each week is saved automatically (in the browser), so next week you can **duplicate
last week's plan** and just edit what changed instead of starting from scratch.

## What it doesn't do (yet)

This is a client-only app with no server and no external accounts connected, so it
can't reach Google Sheets, Outlook, Planning Center, or WhatsApp directly:

- You still glance at the EC Ops Calendar / Overview sheets to get the sermon title,
  speaker, and any special notes for the week — there's no auto-pull yet.
- You still paste the final email into Outlook and hit send yourself (the "Copy email"
  button gets it 95% of the way there).
- Volunteer emails come from your own saved roster (Volunteer Roster tab) rather than
  a live PCO lookup — add people once (or bulk-paste rows copied from PCO/Excel) and
  just check who's on for the week going forward.
- The pastor check-in is a copy-paste into WhatsApp, not an automated message.

If any of these become painful, the roster/email/PDF pieces can be extended to pull
from a published Google Sheet or a proper PCO export later.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build, output in dist/
```

`npm run build` produces a static `dist/` folder that can be hosted for free on
Vercel, Netlify, GitHub Pages, or similar — no backend required.

## Data model

Each weekly plan (`src/types.ts`) is:

- **Segments** — the order of service. Each item has a duration; start times are
  auto-chained from the service start time (edit one duration and everything after it
  shifts automatically). Pin an exact time on an item if it can't move.
- **Assignments** — a segment can be tagged with one or more teams (e.g. "Service
  Leaders", "SM and MM Teams") plus an action note. These drive the per-team tables in
  the email — a segment with no assignment just doesn't show up there.
- **Rehearsal** — a separate chained schedule, same idea as segments.
- **Call times** — a simple time + label list.
- **Roster** — your volunteer directory (name, email, team), stored once and reused
  every week.

Everything is stored in the browser's local storage. There's no login and no shared
backend, so it's tied to whichever browser/profile you use it in.
