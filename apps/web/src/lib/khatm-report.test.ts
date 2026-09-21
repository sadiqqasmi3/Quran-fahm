import { describe, expect, it } from "vitest";
import type { KhatmRoom } from "@quran-feham/contracts";
import { generateKhatmCsv } from "./khatm-report";

describe("generateKhatmCsv", () => {
  const sampleRoom: KhatmRoom = {
    id: "room-1",
    name: "Family Khatm Ramadan",
    intention: "For our parents and barakah",
    targetKhatms: 1,
    startDate: "2026-09-20T00:00:00.000Z",
    deadline: "2026-09-27T23:59:59.000Z",
    inviteCode: "test-invite",
    joinCode: "TESTCODE",
    recurrence: "weekly",
    autoRestartOnComplete: true,
    maxActiveParasPerMember: 4,
    reminderCadence: "daily",
    ownerUserId: "user-1",
    viewerRole: "owner",
    members: [
      {
        userId: "user-1",
        displayName: "Sadiq Qasmi",
        role: "owner",
        joinedAt: "2026-09-20T00:00:00.000Z",
        activeParaCount: 1,
      },
    ],
    activeCampaign: {
      id: "camp-1",
      number: 1,
      status: "active",
      targetKhatms: 1,
      startDate: "2026-09-20T00:00:00.000Z",
      deadline: "2026-09-27T23:59:59.000Z",
      createdAt: "2026-09-20T00:00:00.000Z",
      endedAt: null,
      slots: [
        {
          id: "slot-1",
          khatmNumber: 1,
          juzNumber: 1,
          status: "completed",
          claimedByUserId: "user-1",
          claimedAt: "2026-09-20T01:00:00.000Z",
          readingStartedAt: "2026-09-20T01:10:00.000Z",
          completedAt: "2026-09-20T03:00:00.000Z",
          assignedByUserId: null,
        },
        {
          id: "slot-2",
          khatmNumber: 1,
          juzNumber: 2,
          status: "available",
          claimedByUserId: null,
          claimedAt: null,
          readingStartedAt: null,
          completedAt: null,
          assignedByUserId: null,
        },
      ],
    },
    recentCampaigns: [],
    recentActivity: [],
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
  };

  it("generates a CSV containing room header, Daurah number, and statistics", () => {
    const csv = generateKhatmCsv(sampleRoom);
    expect(csv).toContain("Room Name,Family Khatm Ramadan");
    expect(csv).toContain("Daurah (Cycle) Number,#1");
    expect(csv).toContain("Summary Statistics");
    expect(csv).toContain("Total Paras,Completed,Reading,Chosen,Available,Progress Percentage");
    expect(csv).toContain("2,1,0,0,1,50%");
  });

  it("lists each Para with its Arabic and Latin name, reader, and status", () => {
    const csv = generateKhatmCsv(sampleRoom);
    expect(csv).toContain("Khatm #1,1,الم,Alif Lam Mim,1:1 – 2:141,Sadiq Qasmi,Completed");
    expect(csv).toContain("Khatm #1,2,سَيَقُولُ,Sayaqool,2:142 – 2:252,Unclaimed (Available),Available");
  });
});
