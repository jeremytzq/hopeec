import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { WeeklyPlan } from "./types";
import { chainTimes, displayTime, formatDuration } from "./utils/time";

export function generateServiceBriefPdf(plan: WeeklyPlan): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 30;
  const gap = 20;
  const colWidth = (pageWidth - margin * 2 - gap) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + gap;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(plan.serviceName, leftX, margin);
  if (plan.sermonTitle) {
    doc.setFont("helvetica", "italic");
    doc.text(plan.sermonTitle, leftX, margin + 14);
  }
  doc.setFont("helvetica", "bold");
  doc.text(`${plan.serviceName} Rehearsal`, rightX, margin);

  const { times: segTimes, endTime } = chainTimes(plan.startTime, plan.segments);
  const totalMin = plan.segments.reduce((s, seg) => s + seg.durationMin, 0);
  const segRows = plan.segments.map((seg, i) => [
    displayTime(segTimes[i]),
    formatDuration(seg.durationMin),
    seg.program,
  ]);
  segRows.push([displayTime(endTime), `${totalMin} min`, ""]);

  const tableTop = margin + (plan.sermonTitle ? 26 : 12);

  autoTable(doc, {
    startY: tableTop,
    margin: { left: leftX },
    tableWidth: colWidth,
    head: [["Time", "Duration", "Program"]],
    body: segRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.5, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: colWidth * 0.18 }, 1: { cellWidth: colWidth * 0.2 } },
  });

  const { times: rehTimes } = chainTimes(plan.rehearsalStartTime, plan.rehearsal);
  const rehRows = plan.rehearsal.map((item, i) => [
    displayTime(rehTimes[i]),
    item.noDuration ? "" : formatDuration(item.durationMin),
    item.program,
  ]);

  autoTable(doc, {
    startY: tableTop,
    margin: { left: rightX },
    tableWidth: colWidth,
    head: [["Time", "Duration", "Program"]],
    body: rehRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [237, 125, 49], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: colWidth * 0.18 }, 1: { cellWidth: colWidth * 0.2 } },
    bodyStyles: { fillColor: [252, 228, 214] },
  });

  return doc;
}

export function downloadServiceBriefPdf(plan: WeeklyPlan): void {
  const doc = generateServiceBriefPdf(plan);
  const filename = `${plan.serviceName.replace(/[^\w]+/g, "_")}_${plan.date}.pdf`;
  doc.save(filename);
}
