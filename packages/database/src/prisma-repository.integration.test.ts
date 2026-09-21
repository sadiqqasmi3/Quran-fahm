import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPrismaRepository } from "./prisma-repository.js";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("PrismaRepository PostgreSQL integration", () => {
  it("persists preferences, reading position, and complete refresh rotation history", async () => {
    const handle = createPrismaRepository(databaseUrl as string);
    let userId: string | undefined;
    try {
      const user = await handle.repository.createUser({
        email: `repository-${randomUUID()}@example.test`,
        passwordHash: "integration-test-hash",
        locale: "ur",
      });
      userId = user.id;

      await handle.repository.createDefaultPreferences(user.id, "ur");
      await handle.repository.updatePreferences(user.id, {
        interfaceLocale: "en",
        translationEditionId: "en.sahih",
        recitationEditionId: "ar.alafasy",
        theme: "DARK",
        arabicScale: 1.2,
        dailyGoalMinutes: 15,
      });
      await expect(handle.repository.findPreferences(user.id)).resolves.toMatchObject({
        interfaceLocale: "en",
        theme: "DARK",
        dailyGoalMinutes: 15,
      });

      await handle.repository.saveReadingPosition({
        userId: user.id,
        surahNumber: 2,
        ayahNumber: 255,
        mode: "study",
      });
      await expect(handle.repository.findLatestReadingPosition(user.id)).resolves.toMatchObject({
        surahNumber: 2,
        ayahNumber: 255,
      });
      await expect(
        handle.repository.client.readingPosition.create({
          data: { userId: user.id, surahNumber: 1, ayahNumber: 8, mode: "read" },
        }),
      ).rejects.toThrow();
      await expect(
        handle.repository.client.userPreference.update({
          where: { userId: user.id },
          data: { recitationEditionId: "unreviewed.reciter" },
        }),
      ).rejects.toThrow();

      const challenge = await handle.repository.createOtpChallenge({
        userId: user.id,
        email: user.email,
        purpose: "VERIFY_EMAIL",
        codeHash: "4".repeat(64),
        expiresAt: new Date(Date.now() + 60_000),
      });
      await Promise.all(
        Array.from({ length: 10 }, () =>
          handle.repository.applyOtpAttempt(challenge.id, false, 5, new Date()),
        ),
      );
      await expect(
        handle.repository.applyOtpAttempt(challenge.id, true, 5, new Date()),
      ).resolves.toBe(false);
      await expect(
        handle.repository.client.otpChallenge.findUniqueOrThrow({ where: { id: challenge.id } }),
      ).resolves.toMatchObject({ attempts: 5, consumedAt: expect.any(Date) });

      const firstHash = "1".repeat(64);
      const secondHash = "2".repeat(64);
      const thirdHash = "3".repeat(64);
      const expiresAt = new Date(Date.now() + 60_000);
      const session = await handle.repository.createSession({
        userId: user.id,
        tokenFamilyId: randomUUID(),
        refreshTokenHash: firstHash,
        deviceName: "PostgreSQL integration test",
        expiresAt,
      });
      expect(
        await handle.repository.rotateSession(
          session.id,
          firstHash,
          secondHash,
          new Date(),
          expiresAt,
        ),
      ).not.toBeNull();
      expect(
        await handle.repository.rotateSession(
          session.id,
          secondHash,
          thirdHash,
          new Date(),
          expiresAt,
        ),
      ).not.toBeNull();
      await expect(
        handle.repository.findSessionByRefreshTokenHash(firstHash),
      ).resolves.toMatchObject({ matched: "rotated", session: { id: session.id } });
    } finally {
      if (userId) await handle.repository.client.user.deleteMany({ where: { id: userId } });
      await handle.close();
    }
  });

  it("serializes competing claims for the same Khatm Para slot", async () => {
    const handle = createPrismaRepository(databaseUrl as string);
    const userIds: string[] = [];
    try {
      const owner = await handle.repository.createUser({
        email: `khatm-owner-${randomUUID()}@example.test`,
        passwordHash: "integration-test-hash",
        locale: "ur",
      });
      const member = await handle.repository.createUser({
        email: `khatm-member-${randomUUID()}@example.test`,
        passwordHash: "integration-test-hash",
        locale: "ur",
      });
      userIds.push(owner.id, member.id);
      const room = await handle.repository.createKhatmRoom({
        ownerUserId: owner.id,
        name: "Integration Khatm",
        targetKhatms: 1,
        inviteCode: randomUUID().replaceAll("-", ""),
      });
      await handle.repository.joinKhatmRoomByInviteCode(room.inviteCode, member.id);
      const claim = (userId: string) =>
        handle.repository.mutateKhatmSlot({
          userId,
          roomId: room.id,
          campaignId: room.activeCampaign.id,
          khatmNumber: 1,
          juzNumber: 1,
          action: "CLAIM",
          occurredAt: new Date(),
        });

      const attempts = await Promise.allSettled([claim(owner.id), claim(member.id)]);
      expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
      const rejected = attempts.find((attempt) => attempt.status === "rejected");
      expect(rejected?.status === "rejected" ? rejected.reason : undefined).toMatchObject({
        code: "SLOT_UNAVAILABLE",
      });
      await expect(
        handle.repository.client.khatmParaSlot.findUniqueOrThrow({
          where: {
            campaignId_khatmNumber_juzNumber: {
              campaignId: room.activeCampaign.id,
              khatmNumber: 1,
              juzNumber: 1,
            },
          },
        }),
      ).resolves.toMatchObject({ status: "CLAIMED", claimedByUserId: expect.any(String) });
    } finally {
      if (userIds.length) {
        await handle.repository.client.user.deleteMany({ where: { id: { in: userIds } } });
      }
      await handle.close();
    }
  });
});
