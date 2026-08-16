import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { WeeklyPlan } from "./types";
import { chainTimes, displayTime, displayTimeWithMeridiem, formatDuration } from "./utils/time";

// Matches the app's own palette (App.css) so the printed brief feels like the same product.
const COLOR = {
  blue: [47, 111, 237] as [number, number, number], // Order of Service
  blueTint: [235, 241, 253] as [number, number, number],
  orange: [237, 125, 49] as [number, number, number], // Rehearsal
  orangeTint: [253, 237, 225] as [number, number, number],
  text: [28, 34, 48] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  border: [216, 219, 224] as [number, number, number],
  totalRow: [242, 242, 242] as [number, number, number],
};

export function generateServiceBriefPdf(plan: WeeklyPlan): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 36;
  const gap = 24;
  const colWidth = (pageWidth - margin * 2 - gap) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + gap;

  // --- Masthead ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLOR.text);
  doc.text(plan.serviceName, leftX, margin + 4);

  if (plan.sermonTitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11.5);
    doc.setTextColor(...COLOR.muted);
    doc.text(plan.sermonTitle, leftX, margin + 21);
  }

  // Right-aligned info line: date, speaker, holy communion
  const infoParts = [
    new Date(plan.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    plan.speaker ? `Speaker: ${plan.speaker}` : "",
    `Holy Communion: ${plan.holyCommunion ? "Yes" : "No"}`,
  ].filter(Boolean);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR.muted);
  doc.text(infoParts.join("   ·   "), pageWidth - margin, margin + 4, { align: "right" });

  // Accent rule under the masthead
  const ruleY = margin + 30;
  doc.setDrawColor(...COLOR.blue);
  doc.setLineWidth(2);
  doc.line(leftX, ruleY, pageWidth - margin, ruleY);

  const sectionTop = ruleY + 20;

  // --- Section labels ---
  function sectionLabel(text: string, x: number, color: [number, number, number]) {
    doc.setFillColor(...color);
    doc.rect(x, sectionTop - 10, 4, 13, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...COLOR.text);
    doc.text(text, x + 10, sectionTop);
  }
  sectionLabel(plan.serviceName, leftX, COLOR.blue);
  sectionLabel(`${plan.serviceName} Rehearsal`, rightX, COLOR.orange);

  const tableTop = sectionTop + 12;

  const { times: segTimes, endTime } = chainTimes(plan.startTime, plan.segments);
  const totalMin = plan.segments.reduce((s, seg) => s + seg.durationMin, 0);
  const segRows = plan.segments.map((seg, i) => [
    displayTime(segTimes[i]),
    formatDuration(seg.durationMin),
    seg.program,
  ]);
  const totalRowIndex = segRows.length;
  segRows.push([displayTime(endTime), `${totalMin} min`, ""]);

  autoTable(doc, {
    startY: tableTop,
    margin: { left: leftX },
    tableWidth: colWidth,
    head: [["Time", "Duration", "Program"]],
    body: segRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5, textColor: COLOR.text, lineColor: COLOR.border, lineWidth: 0.75 },
    headStyles: { fillColor: COLOR.blue, textColor: [255, 255, 255], fontStyle: "bold", halign: "left" },
    alternateRowStyles: { fillColor: COLOR.blueTint },
    columnStyles: {
      0: { cellWidth: colWidth * 0.16, halign: "center", fontStyle: "bold" },
      1: { cellWidth: colWidth * 0.2, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.row.section === "body" && data.row.index === totalRowIndex) {
        data.cell.styles.fillColor = COLOR.totalRow;
        data.cell.styles.fontStyle = "bold";
      }
    },
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
    styles: { fontSize: 9, cellPadding: 5, textColor: COLOR.text, lineColor: COLOR.border, lineWidth: 0.75 },
    headStyles: { fillColor: COLOR.orange, textColor: [255, 255, 255], fontStyle: "bold", halign: "left" },
    alternateRowStyles: { fillColor: COLOR.orangeTint },
    columnStyles: {
      0: { cellWidth: colWidth * 0.16, halign: "center", fontStyle: "bold" },
      1: { cellWidth: colWidth * 0.2, halign: "center" },
    },
  });

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...COLOR.border);
  doc.setLineWidth(0.75);
  doc.line(margin, pageHeight - 26, pageWidth - margin, pageHeight - 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR.muted);
  doc.text("EC Service Planner", margin, pageHeight - 14);
  doc.text(`Service time ${displayTimeWithMeridiem(plan.serviceClockTime || plan.startTime)}`, pageWidth - margin, pageHeight - 14, { align: "right" });

  return doc;
}

export function downloadServiceBriefPdf(plan: WeeklyPlan): void {
  const doc = generateServiceBriefPdf(plan);
  const filename = `${plan.serviceName.replace(/[^\w]+/g, "_")}_${plan.date}.pdf`;
  doc.save(filename);
}
