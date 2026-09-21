import { describe, expect, it } from "vitest";
import type { KhatmRepositoryError } from "./domain.js";
import { MemoryRepository } from "./memory-repository.js";

async function learner(repository: MemoryRepository, email: string) {
  return repository.createUser({ email, passwordHash: "test-hash", locale: "ur" });
}

describe("MemoryRepository Khatm rooms", () => {
  it("creates an owner membership, one campaign, and 30 slots per requested Khatm", async () => {
    const repository = new MemoryRepository();
    const owner = await learner(repository, "owner@example.test");

    const room = await repository.createKhatmRoom({
      ownerUserId: owner.id,
      name: "Family Khatm",
      intention: "Family intention",
      targetKhatms: 2,
      inviteCode: "a".repeat(32),
    });

    expect(room.viewerRole).toBe("OWNER");
    expect(room.members).toHaveLength(1);
    expect(room.activeCampaign.number).toBe(1);
    expect(room.activeCampaign.slots).toHaveLength(60);
    expect(room.activeCampaign.slots.every((slot) => slot.status === "AVAILABLE")).toBe(true);
    await expect(repository.listKhatmRooms(owner.id)).resolves.toMatchObject([
      { id: room.id, completedSlots: 0, totalSlots: 60, viewerRole: "OWNER" },
    ]);
  });

  it("joins idempotently without allowing a member to acquire the owner role", async () => {
    const repository = new MemoryRepository();
    const owner = await learner(repository, "owner@example.test");
    const member = await learner(repository, "member@example.test");
    const room = await repository.createKhatmRoom({
      ownerUserId: owner.id,
      name: "Family Khatm",
      targetKhatms: 1,
      inviteCode: "b".repeat(32),
    });

    const firstJoin = await repository.joinKhatmRoomByInviteCode(room.inviteCode, member.id);
    const secondJoin = await repository.joinKhatmRoomByInviteCode(room.inviteCode, member.id);

    expect(firstJoin.viewerRole).toBe("MEMBER");
    expect(secondJoin.members).toHaveLength(2);
    expect(secondJoin.members.find((candidate) => candidate.userId === member.id)?.role).toBe(
      "MEMBER",
    );
    expect(secondJoin.members.find((candidate) => candidate.userId === owner.id)?.role).toBe(
      "OWNER",
    );
  });

  it("atomically gives a Para to one claimant and enforces claimant-only transitions", async () => {
    const repository = new MemoryRepository();
    const owner = await learner(repository, "owner@example.test");
    const firstMember = await learner(repository, "first@example.test");
    const secondMember = await learner(repository, "second@example.test");
    const outsider = await learner(repository, "outsider@example.test");
    const room = await repository.createKhatmRoom({
      ownerUserId: owner.id,
      name: "Family Khatm",
      targetKhatms: 1,
      inviteCode: "c".repeat(32),
    });
    await repository.joinKhatmRoomByInviteCode(room.inviteCode, firstMember.id);
    await repository.joinKhatmRoomByInviteCode(room.inviteCode, secondMember.id);
    const mutation = (userId: string, action: "CLAIM" | "RELEASE" | "MARK_READING" | "COMPLETE") =>
      repository.mutateKhatmSlot({
        userId,
        roomId: room.id,
        campaignId: room.activeCampaign.id,
        khatmNumber: 1,
        juzNumber: 17,
        action,
        occurredAt: new Date(),
      });

    const claims = await Promise.allSettled([
      mutation(firstMember.id, "CLAIM"),
      mutation(secondMember.id, "CLAIM"),
    ]);
    expect(claims.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = claims.find((result) => result.status === "rejected");
    expect(rejected?.status === "rejected" ? rejected.reason : undefined).toMatchObject({
      code: "SLOT_UNAVAILABLE",
    });
    const winner = claims.find((result) => result.status === "fulfilled");
    if (winner?.status !== "fulfilled") throw new Error("Expected a winning claim");
    const claimantId = winner.value.claimedByUserId;
    const otherId = claimantId === firstMember.id ? secondMember.id : firstMember.id;

    await expect(mutation(otherId, "MARK_READING")).rejects.toMatchObject({
      code: "NOT_CLAIMANT",
    } satisfies Partial<KhatmRepositoryError>);
    await expect(mutation(claimantId as string, "MARK_READING")).resolves.toMatchObject({
      status: "READING",
    });
    await expect(mutation(claimantId as string, "COMPLETE")).resolves.toMatchObject({
      status: "COMPLETED",
    });
    await expect(mutation(claimantId as string, "RELEASE")).rejects.toMatchObject({
      code: "INVALID_SLOT_STATE",
    } satisfies Partial<KhatmRepositoryError>);
    await expect(mutation(outsider.id, "CLAIM")).rejects.toMatchObject({ code: "NOT_MEMBER" });
    await expect(repository.findKhatmRoomForMember(room.id, outsider.id)).resolves.toBeNull();
  });

  it("supports human-code joining, claim limits, owner reassignment, undo and member removal", async () => {
    const repository = new MemoryRepository();
    const owner = await learner(repository, "admin@example.test");
    const member = await learner(repository, "reader@example.test");
    const room = await repository.createKhatmRoom({
      ownerUserId: owner.id,
      name: "Managed family room",
      targetKhatms: 1,
      inviteCode: "d".repeat(32),
      joinCode: "ABCDEFGH",
      maxActiveParasPerMember: 1,
      recurrence: "NONE",
      reminderCadence: "NONE",
    });

    await expect(repository.findKhatmInvitePreview("abcdefgh")).resolves.toMatchObject({
      joinCode: "ABCDEFGH",
      completedSlots: 0,
      totalSlots: 30,
    });
    await repository.joinKhatmRoomByInviteCode("abcdefgh", member.id);
    const mutate = (juzNumber: number, action: "CLAIM" | "MARK_READING" | "COMPLETE") =>
      repository.mutateKhatmSlot({
        userId: member.id,
        roomId: room.id,
        campaignId: room.activeCampaign.id,
        khatmNumber: 1,
        juzNumber,
        action,
        occurredAt: new Date(),
      });
    await mutate(1, "CLAIM");
    await expect(mutate(2, "CLAIM")).rejects.toMatchObject({ code: "ACTIVE_PARA_LIMIT" });
    await mutate(1, "MARK_READING");
    await mutate(1, "COMPLETE");

    await expect(
      repository.adminAssignKhatmSlot({
        actorUserId: owner.id,
        roomId: room.id,
        campaignId: room.activeCampaign.id,
        khatmNumber: 1,
        juzNumber: 1,
        userId: null,
        reopenCompleted: false,
        occurredAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: "INVALID_SLOT_STATE" });
    await expect(
      repository.adminAssignKhatmSlot({
        actorUserId: owner.id,
        roomId: room.id,
        campaignId: room.activeCampaign.id,
        khatmNumber: 1,
        juzNumber: 1,
        userId: null,
        reopenCompleted: true,
        occurredAt: new Date(),
      }),
    ).resolves.toMatchObject({ status: "AVAILABLE" });
    await repository.adminAssignKhatmSlot({
      actorUserId: owner.id,
      roomId: room.id,
      campaignId: room.activeCampaign.id,
      khatmNumber: 1,
      juzNumber: 2,
      userId: member.id,
      reopenCompleted: false,
      occurredAt: new Date(),
    });
    await repository.removeKhatmMember(room.id, owner.id, member.id);
    const detail = await repository.findKhatmRoomForMember(room.id, owner.id);
    expect(detail?.members).toHaveLength(1);
    expect(detail?.activeCampaign.slots.find((slot) => slot.juzNumber === 2)).toMatchObject({
      status: "AVAILABLE",
      claimedByUserId: null,
    });
    expect(detail?.recentActivity.map((activity) => activity.type)).toEqual(
      expect.arrayContaining([
        "MEMBER_JOINED",
        "PARA_CLAIMED",
        "PARA_COMPLETED",
        "COMPLETION_REOPENED",
        "PARA_REASSIGNED",
        "MEMBER_REMOVED",
      ]),
    );
  });

  it("persists reminders and rolls a completed recurring campaign forward", async () => {
    const repository = new MemoryRepository();
    const owner = await learner(repository, "recurring@example.test");
    const deadline = new Date("2026-10-01T12:00:00.000Z");
    const room = await repository.createKhatmRoom({
      ownerUserId: owner.id,
      name: "Weekly Khatm",
      targetKhatms: 1,
      deadline,
      inviteCode: "e".repeat(32),
      joinCode: "HJKLMNPQ",
      recurrence: "WEEKLY",
      maxActiveParasPerMember: 1,
      reminderCadence: "DEADLINE_1_DAY",
    });
    const reminder = await repository.scheduleKhatmReminder({
      actorUserId: owner.id,
      roomId: room.id,
      scheduledFor: new Date("2026-09-30T12:00:00.000Z"),
      message: "Please complete your Para",
    });
    await expect(repository.listKhatmReminders(room.id, owner.id)).resolves.toHaveLength(1);
    await expect(
      repository.cancelKhatmReminder(room.id, reminder.id, owner.id, new Date()),
    ).resolves.toMatchObject({ status: "CANCELLED" });

    for (let juzNumber = 1; juzNumber <= 30; juzNumber += 1) {
      await repository.mutateKhatmSlot({
        userId: owner.id,
        roomId: room.id,
        campaignId: room.activeCampaign.id,
        khatmNumber: 1,
        juzNumber,
        action: "CLAIM",
        occurredAt: new Date(),
      });
      await repository.mutateKhatmSlot({
        userId: owner.id,
        roomId: room.id,
        campaignId: room.activeCampaign.id,
        khatmNumber: 1,
        juzNumber,
        action: "COMPLETE",
        occurredAt: new Date(),
      });
    }
    const rolled = await repository.findKhatmRoomForMember(room.id, owner.id);
    expect(rolled?.activeCampaign).toMatchObject({ number: 2, status: "ACTIVE" });
    expect(rolled?.deadline?.toISOString()).toBe("2026-10-08T12:00:00.000Z");
    expect(rolled?.recentCampaigns).toEqual(
      expect.arrayContaining([expect.objectContaining({ number: 1, status: "COMPLETED" })]),
    );
  });
});
