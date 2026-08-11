import html2canvas from "html2canvas";
import type { WeeklyPlan } from "./types";
import { chainTimes, displayTime, formatDuration } from "./utils/time";

function buildProgramTableEl(plan: WeeklyPlan): HTMLElement {
  const { times, endTime } = chainTimes(plan.startTime, plan.segments);
  const totalMin = plan.segments.reduce((s, seg) => s + seg.durationMin, 0);

  const wrap = document.createElement("div");
  wrap.style.cssText = "display:inline-block;background:#ffffff;padding:20px;font-family:Calibri,Arial,sans-serif;color:#1c2230;";

  const title = document.createElement("div");
  title.style.cssText = "font-size:16px;font-weight:700;margin-bottom:2px;";
  title.textContent = plan.serviceName;
  wrap.appendChild(title);

  if (plan.sermonTitle) {
    const sub = document.createElement("div");
    sub.style.cssText = "font-style:italic;font-size:13px;margin-bottom:10px;color:#444;";
    sub.textContent = plan.sermonTitle + (plan.speaker ? ` — ${plan.speaker}` : "");
    wrap.appendChild(sub);
  }

  const table = document.createElement("table");
  table.style.cssText = "border-collapse:collapse;font-size:13px;min-width:360px;";

  const head = document.createElement("tr");
  ["Time", "Duration", "Programme"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.cssText = "border:1px solid #333;padding:6px 10px;background:#f2f2f2;text-align:left;";
    head.appendChild(th);
  });
  table.appendChild(head);

  plan.segments.forEach((seg, i) => {
    const tr = document.createElement("tr");
    [displayTime(times[i]), formatDuration(seg.durationMin), seg.program].forEach((val, colIdx) => {
      const td = document.createElement("td");
      td.textContent = val;
      td.style.cssText = `border:1px solid #333;padding:6px 10px;${colIdx === 2 ? "" : "white-space:nowrap;"}`;
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  const totalRow = document.createElement("tr");
  [displayTime(endTime), `${totalMin} min`, ""].forEach((val) => {
    const td = document.createElement("td");
    td.textContent = val;
    td.style.cssText = "border:1px solid #333;padding:6px 10px;font-weight:700;white-space:nowrap;";
    totalRow.appendChild(td);
  });
  table.appendChild(totalRow);

  wrap.appendChild(table);
  return wrap;
}

async function renderToCanvas(plan: WeeklyPlan): Promise<HTMLCanvasElement> {
  const el = buildProgramTableEl(plan);
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "-10000px";
  document.body.appendChild(el);
  try {
    return await html2canvas(el, { backgroundColor: "#ffffff", scale: 2 });
  } finally {
    document.body.removeChild(el);
  }
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not generate image");
  return blob;
}

export async function downloadProgramImage(plan: WeeklyPlan): Promise<void> {
  const canvas = await renderToCanvas(plan);
  const blob = await canvasToPngBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${plan.serviceName.replace(/[^\w]+/g, "_")}_${plan.date}_program.png`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyProgramImageToClipboard(plan: WeeklyPlan): Promise<void> {
  const canvas = await renderToCanvas(plan);
  const blob = await canvasToPngBlob(canvas);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
