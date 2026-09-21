import { MemoryRepository } from "@quran-feham/database";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { MemoryAuthMailer } from "./mailer.js";

const allowedOrigin = "http://localhost:3000";

function testConfig() {
  return loadConfig(
    { NODE_ENV: "test" },
    {
      jwtSecret: "test-jwt-secret-with-at-least-thirty-two-characters",
      refreshTokenPepper: "test-refresh-pepper-with-at-least-thirty-two-characters",
      otpPepper: "test-otp-pepper-with-at-least-thirty-two-characters",
      requireOrigin: true,
      allowedOrigins: new Set([allowedOrigin]),
      exposeDevelopmentCodes: true,
      rateLimitMax: 100,
    },
  );
}

function cookieHeader(headers: Record<string, string | string[] | number | undefined>): string {
  const raw = headers["set-cookie"];
  const combined = Array.isArray(raw) ? raw.join("\n") : String(raw ?? "");
  const access = /(?:^|\n)qf_access=([^;]+)/.exec(combined)?.[1] ?? "";
  const refresh = /(?:^|\n)qf_refresh=([^;]+)/.exec(combined)?.[1] ?? "";
  return `qf_access=${access}; qf_refresh=${refresh}`;
}

async function verifiedUser(app: FastifyInstance, mailer: MemoryAuthMailer, email: string) {
  const registered = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    headers: { origin: allowedOrigin },
    payload: {
      email,
      password: "SecurePassword9",
      displayName: email.split("@")[0],
      locale: "ur",
    },
  });
  expect(registered.statusCode).toBe(201);
  const code = mailer.latest(email, "verify-email")?.code;
  const verified = await app.inject({
    method: "POST",
    url: "/api/v1/auth/verify-email",
    headers: { origin: allowedOrigin },
    payload: { email, code },
  });
  expect(verified.statusCode).toBe(200);
  return cookieHeader(registered.headers);
}

describe("Khatm Rooms API", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("requires auth, creates and joins a room, and serializes one winner for a raced Para claim", async () => {
    const repository = new MemoryRepository();
    const mailer = new MemoryAuthMailer();
    app = await buildApp({ config: testConfig(), repository, mailer });

    const unauthenticated = await app.inject({
      method: "POST",
      url: "/api/v1/khatm/rooms",
      headers: { origin: allowedOrigin },
      payload: { name: "Family Khatm", targetKhatms: 1 },
    });
    expect(unauthenticated.statusCode).toBe(401);

    const ownerCookie = await verifiedUser(app, mailer, "khatm-owner@example.test");
    const memberCookie = await verifiedUser(app, mailer, "khatm-member@example.test");
    const outsiderCookie = await verifiedUser(app, mailer, "khatm-outsider@example.test");

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/khatm/rooms",
      headers: { origin: allowedOrigin, cookie: ownerCookie },
      payload: {
        name: "Qasmi Family",
        intention: "A family intention",
        targetKhatms: 2,
      },
    });
    expect(created.statusCode).toBe(201);
    const room = created.json().room;
    expect(room.viewerRole).toBe("owner");
    expect(room.activeCampaign.slots).toHaveLength(60);
    expect(room.inviteCode).toMatch(/^[A-Za-z0-9_-]{32}$/);

    const hiddenFromOutsider = await app.inject({
      method: "GET",
      url: `/api/v1/khatm/rooms/${room.id}`,
      headers: { cookie: outsiderCookie },
    });
    expect(hiddenFromOutsider.statusCode).toBe(404);

    const joined = await app.inject({
      method: "POST",
      url: "/api/v1/khatm/rooms/join",
      headers: { origin: allowedOrigin, cookie: memberCookie },
      payload: { inviteCode: room.inviteCode },
    });
    expect(joined.statusCode).toBe(200);
    expect(joined.json().room).toMatchObject({ viewerRole: "member" });
    expect(joined.json().room.members).toHaveLength(2);

    const slotPath = `/api/v1/khatm/rooms/${room.id}/campaigns/${room.activeCampaign.id}/slots/1/17`;
    const claims = await Promise.all([
      app.inject({
        method: "POST",
        url: `${slotPath}/claim`,
        headers: { origin: allowedOrigin, cookie: ownerCookie },
      }),
      app.inject({
        method: "POST",
        url: `${slotPath}/claim`,
        headers: { origin: allowedOrigin, cookie: memberCookie },
      }),
    ]);
    expect(claims.map((response) => response.statusCode).sort()).toEqual([200, 409]);
    expect(claims.find((response) => response.statusCode === 409)?.json().code).toBe(
      "KHATM_SLOT_UNAVAILABLE",
    );
    const winner = claims.find((response) => response.statusCode === 200);
    if (!winner) throw new Error("Expected a winning claimant");
    const ownerWon = winner.json().slot.claimedByUserId === room.ownerUserId;
    const winnerCookie = ownerWon ? ownerCookie : memberCookie;
    const loserCookie = ownerWon ? memberCookie : ownerCookie;

    const forbidden = await app.inject({
      method: "POST",
      url: `${slotPath}/release`,
      headers: { origin: allowedOrigin, cookie: loserCookie },
    });
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.json().code).toBe("KHATM_SLOT_NOT_ASSIGNED");

    const reading = await app.inject({
      method: "POST",
      url: `${slotPath}/reading`,
      headers: { origin: allowedOrigin, cookie: winnerCookie },
    });
    expect(reading.statusCode).toBe(200);
    expect(reading.json().slot.status).toBe("reading");

    const completed = await app.inject({
      method: "POST",
      url: `${slotPath}/complete`,
      headers: { origin: allowedOrigin, cookie: winnerCookie },
    });
    expect(completed.statusCode).toBe(200);
    expect(completed.json().slot.status).toBe("completed");

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/khatm/rooms",
      headers: { cookie: memberCookie },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json().rooms).toMatchObject([
      { id: room.id, viewerRole: "member", completedSlots: 1, totalSlots: 60 },
    ]);
  });

  it("validates room limits and invitation codes", async () => {
    const mailer = new MemoryAuthMailer();
    app = await buildApp({ config: testConfig(), mailer });
    const cookie = await verifiedUser(app, mailer, "validation@example.test");

    const invalidTarget = await app.inject({
      method: "POST",
      url: "/api/v1/khatm/rooms",
      headers: { origin: allowedOrigin, cookie },
      payload: { name: "Family Khatm", targetKhatms: 11 },
    });
    expect(invalidTarget.statusCode).toBe(400);
    expect(invalidTarget.json().fieldErrors.targetKhatms).toBeDefined();

    const invalidInvite = await app.inject({
      method: "POST",
      url: "/api/v1/khatm/rooms/join",
      headers: { origin: allowedOrigin, cookie },
      payload: { inviteCode: "guessable" },
    });
    expect(invalidInvite.statusCode).toBe(400);
    expect(invalidInvite.json().fieldErrors.inviteCode).toBeDefined();
  });

  it("supports preview, human-code join, owner controls, reminders and campaign rollover", async () => {
    const repository = new MemoryRepository();
    const mailer = new MemoryAuthMailer();
    app = await buildApp({ config: testConfig(), repository, mailer });
    const ownerCookie = await verifiedUser(app, mailer, "owner-controls@example.test");
    const memberCookie = await verifiedUser(app, mailer, "member-controls@example.test");

    const createdResponse = await app.inject({
      method: "POST",
      url: "/api/v1/khatm/rooms",
      headers: { origin: allowedOrigin, cookie: ownerCookie },
      payload: {
        name: "Weekly family room",
        targetKhatms: 1,
        recurrence: "weekly",
        maxActiveParasPerMember: 1,
        reminderCadence: "deadline_1_day",
        deadline: "2026-10-01T12:00:00.000Z",
      },
    });
    expect(createdResponse.statusCode).toBe(201);
    const created = createdResponse.json().room;
    expect(created.inviteCode).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(created.joinCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);

    const preview = await app.inject({
      method: "GET",
      url: `/api/v1/khatm/invitations/${created.joinCode.toLowerCase()}`,
    });
    expect(preview.statusCode).toBe(200);
    expect(preview.json().invitation).toMatchObject({
      name: "Weekly family room",
      joinCode: created.joinCode,
      completedSlots: 0,
      totalSlots: 30,
    });

    const joined = await app.inject({
      method: "POST",
      url: "/api/v1/khatm/rooms/join",
      headers: { origin: allowedOrigin, cookie: memberCookie },
      payload: { inviteCode: created.joinCode.toLowerCase() },
    });
    expect(joined.statusCode).toBe(200);
    expect(joined.json().room).toMatchObject({ viewerRole: "member", inviteCode: null });

    const memberRotation = await app.inject({
      method: "POST",
      url: `/api/v1/khatm/rooms/${created.id}/invitation/rotate`,
      headers: { origin: allowedOrigin, cookie: memberCookie },
    });
    expect(memberRotation.statusCode).toBe(403);
    expect(memberRotation.json().code).toBe("KHATM_OWNER_REQUIRED");

    const rotated = await app.inject({
      method: "POST",
      url: `/api/v1/khatm/rooms/${created.id}/invitation/rotate`,
      headers: { origin: allowedOrigin, cookie: ownerCookie },
    });
    expect(rotated.statusCode).toBe(200);
    expect(rotated.json().room.joinCode).not.toBe(created.joinCode);
    expect(
      (
        await app.inject({
          method: "GET",
          url: `/api/v1/khatm/invitations/${created.joinCode}`,
        })
      ).statusCode,
    ).toBe(404);

    const room = rotated.json().room;
    const member = joined
      .json()
      .room.members.find((candidate: { role: string }) => candidate.role === "member");
    const slotPath = `/api/v1/khatm/rooms/${room.id}/campaigns/${room.activeCampaign.id}/slots/1`;
    expect(
      (
        await app.inject({
          method: "POST",
          url: `${slotPath}/1/claim`,
          headers: { origin: allowedOrigin, cookie: memberCookie },
        })
      ).statusCode,
    ).toBe(200);
    const limited = await app.inject({
      method: "POST",
      url: `${slotPath}/2/claim`,
      headers: { origin: allowedOrigin, cookie: memberCookie },
    });
    expect(limited.statusCode).toBe(409);
    expect(limited.json().code).toBe("KHATM_ACTIVE_PARA_LIMIT");

    await app.inject({
      method: "POST",
      url: `${slotPath}/1/complete`,
      headers: { origin: allowedOrigin, cookie: memberCookie },
    });
    const undo = await app.inject({
      method: "PUT",
      url: `${slotPath}/1/assignment`,
      headers: { origin: allowedOrigin, cookie: ownerCookie },
      payload: { userId: null, reopenCompleted: true },
    });
    expect(undo.statusCode).toBe(200);
    expect(undo.json().slot.status).toBe("available");

    const assigned = await app.inject({
      method: "PUT",
      url: `${slotPath}/2/assignment`,
      headers: { origin: allowedOrigin, cookie: ownerCookie },
      payload: { userId: member.userId },
    });
    expect(assigned.statusCode).toBe(200);
    expect(assigned.json().slot.claimedByUserId).toBe(member.userId);

    const reminder = await app.inject({
      method: "POST",
      url: `/api/v1/khatm/rooms/${room.id}/reminders`,
      headers: { origin: allowedOrigin, cookie: ownerCookie },
      payload: {
        scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
        message: "Please finish your Para today",
      },
    });
    expect(reminder.statusCode).toBe(201);
    const cancelledReminder = await app.inject({
      method: "DELETE",
      url: `/api/v1/khatm/rooms/${room.id}/reminders/${reminder.json().reminder.id}`,
      headers: { origin: allowedOrigin, cookie: ownerCookie },
    });
    expect(cancelledReminder.statusCode).toBe(200);
    expect(cancelledReminder.json().reminder.status).toBe("cancelled");

    const prematureNext = await app.inject({
      method: "POST",
      url: `/api/v1/khatm/rooms/${room.id}/campaigns/next`,
      headers: { origin: allowedOrigin, cookie: ownerCookie },
      payload: {},
    });
    expect(prematureNext.statusCode).toBe(409);
    const next = await app.inject({
      method: "POST",
      url: `/api/v1/khatm/rooms/${room.id}/campaigns/next`,
      headers: { origin: allowedOrigin, cookie: ownerCookie },
      payload: { cancelCurrent: true },
    });
    expect(next.statusCode).toBe(200);
    expect(next.json().room.activeCampaign.number).toBe(2);
    expect(next.json().room.recentCampaigns).toEqual(
      expect.arrayContaining([expect.objectContaining({ number: 1, status: "cancelled" })]),
    );

    const removed = await app.inject({
      method: "DELETE",
      url: `/api/v1/khatm/rooms/${room.id}/members/${member.userId}`,
      headers: { origin: allowedOrigin, cookie: ownerCookie },
    });
    expect(removed.statusCode).toBe(204);
    const refreshed = await app.inject({
      method: "GET",
      url: `/api/v1/khatm/rooms/${room.id}`,
      headers: { cookie: ownerCookie },
    });
    expect(refreshed.json().room.members).toHaveLength(1);
    expect(refreshed.json().room.recentActivity.map((item: { type: string }) => item.type)).toEqual(
      expect.arrayContaining(["member_joined", "invite_rotated", "campaign_cancelled"]),
    );
  });
});
