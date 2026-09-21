import type {
  KhatmCampaign,
  KhatmParaSlot,
  KhatmRoom,
} from "@quran-feham/contracts";
import { formatReference, getPara } from "./para-data";

function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateKhatmCsv(
  room: KhatmRoom,
  campaign: KhatmCampaign = room.activeCampaign,
  members: KhatmRoom["members"] = room.members,
): string {
  const memberNames = new Map(
    members.map((m) => [m.userId, m.displayName || "Room member"]),
  );

  const lines: string[] = [];

  // Metadata block
  lines.push(`Room Name,${escapeCsvField(room.name)}`);
  lines.push(`Daurah (Cycle) Number,#${campaign.number}`);
  lines.push(`Status,${escapeCsvField(campaign.status)}`);
  lines.push(`Target Khatms,${room.targetKhatms}`);
  lines.push(`Intention / Isal-e-Sawab,${escapeCsvField(room.intention || "None specified")}`);
  lines.push(`Deadline,${escapeCsvField(campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : "No deadline")}`);
  lines.push(`Exported At,${escapeCsvField(new Date().toLocaleString())}`);
  lines.push("");

  // Summary statistics
  const total = campaign.slots.length;
  const completed = campaign.slots.filter((s) => s.status === "completed").length;
  const reading = campaign.slots.filter((s) => s.status === "reading").length;
  const claimed = campaign.slots.filter((s) => s.status === "claimed").length;
  const available = campaign.slots.filter((s) => s.status === "available").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  lines.push("Summary Statistics");
  lines.push("Total Paras,Completed,Reading,Chosen,Available,Progress Percentage");
  lines.push(
    [total, completed, reading, claimed, available, `${percent}%`]
      .map(escapeCsvField)
      .join(","),
  );
  lines.push("");

  // Detailed Para assignments table
  lines.push("Para Assignments");
  lines.push(
    [
      "Khatm Cycle",
      "Para Number",
      "Arabic Name",
      "Latin Name",
      "Surah & Ayah Range",
      "Assigned Reader",
      "Assignment Status",
      "Claimed At",
      "Completed At",
    ].join(","),
  );

  const sortedSlots = [...campaign.slots].sort((a, b) => {
    if (a.khatmNumber !== b.khatmNumber) return a.khatmNumber - b.khatmNumber;
    return a.juzNumber - b.juzNumber;
  });

  for (const slot of sortedSlots) {
    const para = getPara(slot.juzNumber);
    const readerName = slot.claimedByUserId
      ? memberNames.get(slot.claimedByUserId) ?? "Unknown reader"
      : "Unclaimed (Available)";
    const range = `${formatReference(para.start)} – ${formatReference(para.end)}`;

    const statusLabel =
      slot.status === "completed"
        ? "Completed"
        : slot.status === "reading"
          ? "Reading"
          : slot.status === "claimed"
            ? "Chosen"
            : "Available";

    const claimedAtStr = slot.claimedAt ? new Date(slot.claimedAt).toLocaleString() : "";
    const completedAtStr = slot.completedAt ? new Date(slot.completedAt).toLocaleString() : "";

    lines.push(
      [
        `Khatm #${slot.khatmNumber}`,
        slot.juzNumber,
        para.nameArabic,
        para.nameLatin,
        range,
        readerName,
        statusLabel,
        claimedAtStr,
        completedAtStr,
      ]
        .map(escapeCsvField)
        .join(","),
    );
  }

  return lines.join("\r\n");
}

export function downloadKhatmReport(
  room: KhatmRoom,
  campaign: KhatmCampaign = room.activeCampaign,
  members: KhatmRoom["members"] = room.members,
): void {
  const csvContent = generateKhatmCsv(room, campaign, members);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const sanitizedRoomName = room.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  anchor.href = url;
  anchor.download = `khatm-report-${sanitizedRoomName}-daurah-${campaign.number}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function printKhatmSummary(
  room: KhatmRoom,
  campaign: KhatmCampaign = room.activeCampaign,
  members: KhatmRoom["members"] = room.members,
): void {
  const memberNames = new Map(
    members.map((m) => [m.userId, m.displayName || "Room member"]),
  );
  const total = campaign.slots.length;
  const completed = campaign.slots.filter((s) => s.status === "completed").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    window.print();
    return;
  }

  const rowsHtml = campaign.slots
    .map((slot) => {
      const para = getPara(slot.juzNumber);
      const reader = slot.claimedByUserId
        ? memberNames.get(slot.claimedByUserId) ?? "Unknown"
        : "—";
      const statusBadge =
        slot.status === "completed"
          ? '<span style="color:#0f5132;background:#d1e7dd;padding:2px 8px;border-radius:4px;font-weight:600">Done</span>'
          : slot.status === "reading"
            ? '<span style="color:#084298;background:#cfe2ff;padding:2px 8px;border-radius:4px;font-weight:600">Reading</span>'
            : slot.status === "claimed"
              ? '<span style="color:#664d03;background:#fff3cd;padding:2px 8px;border-radius:4px;font-weight:600">Chosen</span>'
              : '<span style="color:#41464b;background:#e2e3e5;padding:2px 8px;border-radius:4px">Available</span>';

      return `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:8px 12px;font-weight:bold">Para ${slot.juzNumber}</td>
        <td style="padding:8px 12px;font-family:serif;font-size:1.1em">${para.nameArabic} (${para.nameLatin})</td>
        <td style="padding:8px 12px;color:#6b7280">${formatReference(para.start)} – ${formatReference(para.end)}</td>
        <td style="padding:8px 12px;font-weight:600">${reader}</td>
        <td style="padding:8px 12px;text-align:center">${statusBadge}</td>
      </tr>
    `;
    })
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${room.name} — Daurah #${campaign.number} Report</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #111827; }
          .header { border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: bold; margin: 0; }
          .subtitle { color: #4b5563; margin-top: 4px; font-size: 14px; }
          .stats { display: flex; gap: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          .stat { flex: 1; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
          .stat-val { font-size: 20px; font-weight: bold; color: #111827; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 10px 12px; background: #f3f4f6; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${room.name}</h1>
          <div class="subtitle">
            Khatm Daurah #${campaign.number} (دورة الختم) · Generated on ${new Date().toLocaleString()}
            ${room.intention ? `<br><strong>Intention / Isal-e-Sawab:</strong> ${room.intention}` : ""}
          </div>
        </div>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Progress</div>
            <div class="stat-val" style="color:#16a34a">${percent}% (${completed}/${total})</div>
          </div>
          <div class="stat">
            <div class="stat-label">Members</div>
            <div class="stat-val">${members.length}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Target Khatms</div>
            <div class="stat-val">${room.targetKhatms}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Deadline</div>
            <div class="stat-val" style="font-size:15px">${campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : "None"}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Para</th>
              <th>Surah Name</th>
              <th>Ayah Span</th>
              <th>Reader</th>
              <th style="text-align:center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
