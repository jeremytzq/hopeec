export function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

export function minutesToHHMM(totalMin: number): string {
  const wrapped = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Display like the source sheets: no leading zero on the hour ("9:00", "10:41").
export function displayTime(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return `${parseInt(h, 10)}:${m}`;
}

// "07:00" -> "7:00 AM", "13:30" -> "1:30 PM"
export function displayTimeWithMeridiem(hhmm: string): string {
  const h = parseInt(hhmm.split(":")[0], 10);
  return `${displayTime(hhmm)} ${h < 12 ? "AM" : "PM"}`;
}

// Duration in minutes -> "H:MM" (e.g. 20 -> "0:20", 65 -> "1:05")
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export type Chained = { time: string; durationMin: number };

// Chains a list of durations starting at startTime, returning the computed
// start time for each item plus the end time after the last one.
export function chainTimes(startTime: string, items: { durationMin: number; fixedTime?: string }[]): { times: string[]; endTime: string } {
  let cursor = parseTimeToMinutes(startTime);
  const times: string[] = [];
  for (const item of items) {
    const t = item.fixedTime ? item.fixedTime : minutesToHHMM(cursor);
    times.push(t);
    cursor = (item.fixedTime ? parseTimeToMinutes(item.fixedTime) : cursor) + item.durationMin;
  }
  return { times, endTime: minutesToHHMM(cursor) };
}
