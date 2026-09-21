import { PrismaPg } from "@prisma/adapter-pg";
import {
  type Bookmark,
  type ContentRelease,
  type KhatmParaSlot,
  type KhatmReminder,
  type LearningEvent,
  type OtpChallenge,
  type Prisma,
  PrismaClient,
  type ReadingPosition,
  type Session,
  type User,
  type UserPreference,
} from "@prisma/client";
import type {
  AdminAssignKhatmSlotInput,
  BookmarkRecord,
  ContentReleaseRecord,
  CreateKhatmRoomRecordInput,
  CreateOtpChallengeInput,
  CreateSessionInput,
  CreateUserInput,
  KhatmCampaignSummaryRecord,
  KhatmInvitePreviewRecord,
  KhatmParaSlotRecord,
  KhatmRecurrence,
  KhatmReminderRecord,
  KhatmRoomDetailRecord,
  KhatmRoomSummaryRecord,
  LearningEventRecord,
  MutateKhatmSlotInput,
  OtpChallengeRecord,
  OtpPurpose,
  ReadingPositionRecord,
  ScheduleKhatmReminderRecordInput,
  SessionRecord,
  SessionWithUser,
  StartNextKhatmCampaignRecordInput,
  UpdateKhatmRoomRecordInput,
  UpdateUserPreferencesInput,
  UserPreferenceRecord,
  UserRecord,
} from "./domain.js";
import { KhatmRepositoryError, RepositoryConflictError } from "./domain.js";
import type { QuranFehamRepository } from "./repository.js";

function mapUser(user: User): UserRecord {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    displayName: user.displayName,
    locale: user.locale,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapSession(session: Session): SessionRecord {
  return {
    id: session.id,
    userId: session.userId,
    tokenFamilyId: session.tokenFamilyId,
    refreshTokenHash: session.refreshTokenHash,
    previousRefreshTokenHash: session.previousRefreshTokenHash,
    rotatedAt: session.rotatedAt,
    deviceName: session.deviceName,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
  };
}

function mapOtp(challenge: OtpChallenge): OtpChallengeRecord {
  return {
    id: challenge.id,
    userId: challenge.userId,
    email: challenge.email,
    purpose: challenge.purpose,
    codeHash: challenge.codeHash,
    attempts: challenge.attempts,
    expiresAt: challenge.expiresAt,
    consumedAt: challenge.consumedAt,
    createdAt: challenge.createdAt,
  };
}

function mapPreference(preference: UserPreference): UserPreferenceRecord {
  return {
    userId: preference.userId,
    interfaceLocale: preference.interfaceLocale,
    translationEditionId: preference.translationEditionId,
    recitationEditionId: preference.recitationEditionId,
    quranScript: preference.quranScript,
    theme: preference.theme,
    arabicScale: preference.arabicScale,
    dailyGoalMinutes: preference.dailyGoalMinutes,
    learningGoal: preference.learningGoal,
    remindersEnabled: preference.remindersEnabled,
    onboardingCompletedAt: preference.onboardingCompletedAt,
    createdAt: preference.createdAt,
    updatedAt: preference.updatedAt,
  };
}

function mapReadingPosition(position: ReadingPosition): ReadingPositionRecord {
  return { ...position };
}

function mapBookmark(bookmark: Bookmark): BookmarkRecord {
  return { ...bookmark };
}

function objectJson(value: Prisma.JsonValue): Readonly<Record<string, unknown>> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value as Readonly<Record<string, unknown>>;
}

function mapLearningEvent(event: LearningEvent): LearningEventRecord {
  return {
    id: event.id,
    idempotencyKey: event.idempotencyKey,
    userId: event.userId,
    eventType: event.eventType,
    learningItemId: event.learningItemId,
    masteryDimension: event.masteryDimension,
    rating: event.rating,
    payload: objectJson(event.payload),
    occurredAt: event.occurredAt,
    recordedAt: event.recordedAt,
    contentReleaseId: event.contentReleaseId,
  };
}

function mapContentRelease(release: ContentRelease): ContentReleaseRecord {
  return {
    id: release.id,
    sourceId: release.sourceId,
    provider: release.provider,
    edition: release.edition,
    upstreamVersion: release.upstreamVersion,
    upstreamCommit: release.upstreamCommit,
    sha256: release.sha256,
    license: release.license,
    retrievedAt: release.retrievedAt,
    manifest: objectJson(release.manifest),
    status: release.status,
    createdAt: release.createdAt,
  };
}

const khatmRoomDetailInclude = {
  members: {
    include: { user: { select: { displayName: true } } },
    orderBy: { joinedAt: "asc" },
  },
  campaigns: {
    orderBy: { number: "desc" },
    take: 12,
    include: { slots: { orderBy: [{ khatmNumber: "asc" }, { juzNumber: "asc" }] } },
  },
  activities: {
    orderBy: { occurredAt: "desc" },
    take: 50,
    include: { actor: { select: { displayName: true } } },
  },
} satisfies Prisma.KhatmRoomInclude;

const khatmRoomSummaryInclude = {
  members: { select: { userId: true, role: true } },
  campaigns: {
    where: { status: "ACTIVE" },
    orderBy: { number: "desc" },
    take: 1,
    include: { slots: { select: { status: true } } },
  },
} satisfies Prisma.KhatmRoomInclude;

type KhatmRoomDetailRow = Prisma.KhatmRoomGetPayload<{
  include: typeof khatmRoomDetailInclude;
}>;
type KhatmRoomSummaryRow = Prisma.KhatmRoomGetPayload<{
  include: typeof khatmRoomSummaryInclude;
}>;

function mapKhatmSlot(slot: KhatmParaSlot): KhatmParaSlotRecord {
  return {
    id: slot.id,
    campaignId: slot.campaignId,
    khatmNumber: slot.khatmNumber,
    juzNumber: slot.juzNumber,
    status: slot.status,
    claimedByUserId: slot.claimedByUserId,
    claimedAt: slot.claimedAt,
    readingStartedAt: slot.readingStartedAt,
    completedAt: slot.completedAt,
    assignedByUserId: slot.assignedByUserId,
  };
}

function mapKhatmCampaignSummary(
  campaign: KhatmRoomDetailRow["campaigns"][number],
): KhatmCampaignSummaryRecord {
  return {
    id: campaign.id,
    roomId: campaign.roomId,
    number: campaign.number,
    status: campaign.status,
    targetKhatms: campaign.targetKhatms,
    startDate: campaign.startDate,
    deadline: campaign.deadline,
    createdAt: campaign.createdAt,
    endedAt: campaign.endedAt,
    completedSlots: campaign.slots.filter((slot) => slot.status === "COMPLETED").length,
    totalSlots: campaign.slots.length,
  };
}

function mapKhatmRoomDetail(row: KhatmRoomDetailRow, userId: string): KhatmRoomDetailRecord {
  const viewer = row.members.find((member) => member.userId === userId);
  const campaign = row.campaigns.find((candidate) => candidate.status === "ACTIVE");
  if (!viewer) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a member of this room");
  if (!campaign) throw new Error("Khatm room has no active campaign");
  return {
    id: row.id,
    name: row.name,
    intention: row.intention,
    targetKhatms: row.targetKhatms,
    startDate: row.startDate,
    deadline: row.deadline,
    inviteCode: row.inviteCode,
    joinCode: row.joinCode,
    recurrence: row.recurrence,
    autoRestartOnComplete: row.autoRestartOnComplete,
    maxActiveParasPerMember: row.maxActiveParasPerMember,
    reminderCadence: row.reminderCadence,
    ownerUserId: row.ownerUserId,
    viewerRole: viewer.role,
    members: row.members.map((member) => ({
      userId: member.userId,
      displayName: member.user.displayName,
      role: member.role,
      joinedAt: member.joinedAt,
      activeParaCount: campaign.slots.filter(
        (slot) =>
          slot.claimedByUserId === member.userId &&
          (slot.status === "CLAIMED" || slot.status === "READING"),
      ).length,
    })),
    activeCampaign: {
      id: campaign.id,
      roomId: campaign.roomId,
      number: campaign.number,
      status: campaign.status,
      targetKhatms: campaign.targetKhatms,
      deadline: campaign.deadline,
      createdAt: campaign.createdAt,
      endedAt: campaign.endedAt,
      slots: campaign.slots.map(mapKhatmSlot),
    },
    recentCampaigns: row.campaigns.map(mapKhatmCampaignSummary),
    recentActivity: row.activities.map((activity) => ({
      id: activity.id,
      roomId: activity.roomId,
      type: activity.type,
      actorUserId: activity.actorUserId,
      actorDisplayName: activity.actor?.displayName ?? null,
      targetUserId: activity.targetUserId,
      campaignId: activity.campaignId,
      khatmNumber: activity.khatmNumber,
      juzNumber: activity.juzNumber,
      occurredAt: activity.occurredAt,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapKhatmRoomSummary(row: KhatmRoomSummaryRow, userId: string): KhatmRoomSummaryRecord {
  const viewer = row.members.find((member) => member.userId === userId);
  const campaign = row.campaigns[0];
  if (!viewer) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a member of this room");
  if (!campaign) throw new Error("Khatm room has no active campaign");
  return {
    id: row.id,
    name: row.name,
    intention: row.intention,
    targetKhatms: row.targetKhatms,
    startDate: row.startDate,
    deadline: row.deadline,
    ownerUserId: row.ownerUserId,
    viewerRole: viewer.role,
    memberCount: row.members.length,
    activeCampaignId: campaign.id,
    completedSlots: campaign.slots.filter((slot) => slot.status === "COMPLETED").length,
    totalSlots: campaign.slots.length,
    recurrence: row.recurrence,
    autoRestartOnComplete: row.autoRestartOnComplete,
    maxActiveParasPerMember: row.maxActiveParasPerMember,
    createdAt: row.createdAt,
  };
}

function mapKhatmReminder(reminder: KhatmReminder): KhatmReminderRecord {
  return {
    id: reminder.id,
    roomId: reminder.roomId,
    campaignId: reminder.campaignId,
    createdByUserId: reminder.createdByUserId,
    scheduledFor: reminder.scheduledFor,
    message: reminder.message,
    status: reminder.status,
    sentAt: reminder.sentAt,
    cancelledAt: reminder.cancelledAt,
    createdAt: reminder.createdAt,
  };
}

function nextRecurringDeadline(
  recurrence: KhatmRecurrence,
  previousDeadline: Date | null,
  occurredAt: Date,
): Date | null {
  if (recurrence === "NONE") return null;
  const deadline = new Date((previousDeadline ?? occurredAt).getTime());
  if (recurrence === "THREE_DAYS") deadline.setUTCDate(deadline.getUTCDate() + 3);
  else if (recurrence === "WEEKLY") deadline.setUTCDate(deadline.getUTCDate() + 7);
  else if (recurrence === "BIWEEKLY") deadline.setUTCDate(deadline.getUTCDate() + 14);
  else deadline.setUTCMonth(deadline.getUTCMonth() + 1);
  return deadline;
}

async function createKhatmCampaign(
  transaction: Prisma.TransactionClient,
  input: {
    roomId: string;
    number: number;
    targetKhatms: number;
    startDate?: Date | null;
    deadline: Date | null;
    createdAt?: Date;
  },
) {
  const campaign = await transaction.khatmCampaign.create({
    data: {
      roomId: input.roomId,
      number: input.number,
      targetKhatms: input.targetKhatms,
      startDate: input.startDate ?? null,
      deadline: input.deadline,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    },
  });
  await transaction.khatmParaSlot.createMany({
    data: Array.from({ length: input.targetKhatms }, (_, khatmIndex) =>
      Array.from({ length: 30 }, (_, juzIndex) => ({
        campaignId: campaign.id,
        khatmNumber: khatmIndex + 1,
        juzNumber: juzIndex + 1,
      })),
    ).flat(),
  });
  return campaign;
}

function hasPrismaCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === code);
}

/** Production repository. Mutation methods deliberately exclude updates/deletes for
 * learning events and content releases so those records remain append-only. */
export class PrismaRepository implements QuranFehamRepository {
  constructor(readonly client: PrismaClient) {}

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    return mapUser(
      await this.client.user.create({
        data: {
          email: input.email.trim().toLowerCase(),
          passwordHash: input.passwordHash,
          displayName: input.displayName ?? null,
          locale: input.locale,
        },
      }),
    );
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = await this.client.user.findUnique({ where: { id } });
    return user ? mapUser(user) : null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.client.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return user ? mapUser(user) : null;
  }

  async markEmailVerified(userId: string, verifiedAt: Date): Promise<UserRecord> {
    return mapUser(
      await this.client.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: verifiedAt },
      }),
    );
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.client.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async createSession(input: CreateSessionInput): Promise<SessionRecord> {
    return mapSession(
      await this.client.session.create({
        data: {
          userId: input.userId,
          tokenFamilyId: input.tokenFamilyId,
          refreshTokenHash: input.refreshTokenHash,
          deviceName: input.deviceName,
          userAgent: input.userAgent ?? null,
          ipAddress: input.ipAddress ?? null,
          expiresAt: input.expiresAt,
        },
      }),
    );
  }

  async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    const session = await this.client.session.findUnique({ where: { id: sessionId } });
    return session ? mapSession(session) : null;
  }

  async findSessionByRefreshTokenHash(hash: string): Promise<SessionWithUser | null> {
    const record = await this.client.session.findFirst({
      where: { refreshTokenHash: hash },
      include: { user: true },
    });
    if (record) {
      return {
        session: mapSession(record),
        user: mapUser(record.user),
        matched: "current",
      };
    }
    const rotated = await this.client.refreshTokenTombstone.findUnique({
      where: { tokenHash: hash },
      include: { session: { include: { user: true } } },
    });
    if (!rotated) return null;
    if (rotated.expiresAt <= new Date()) {
      await this.client.refreshTokenTombstone.deleteMany({ where: { tokenHash: hash } });
      return null;
    }
    return {
      session: mapSession(rotated.session),
      user: mapUser(rotated.session.user),
      matched: "rotated",
    };
  }

  async rotateSession(
    sessionId: string,
    expectedHash: string,
    nextHash: string,
    usedAt: Date,
    expiresAt: Date,
  ): Promise<SessionRecord | null> {
    return this.client.$transaction(async (transaction) => {
      const updated = await transaction.session.updateMany({
        where: {
          id: sessionId,
          refreshTokenHash: expectedHash,
          revokedAt: null,
          expiresAt: { gt: usedAt },
        },
        data: {
          previousRefreshTokenHash: expectedHash,
          refreshTokenHash: nextHash,
          rotatedAt: usedAt,
          lastUsedAt: usedAt,
          expiresAt,
        },
      });
      if (updated.count !== 1) return null;
      const session = await transaction.session.findUnique({ where: { id: sessionId } });
      if (session) {
        await transaction.refreshTokenTombstone.create({
          data: {
            tokenHash: expectedHash,
            sessionId,
            tokenFamilyId: session.tokenFamilyId,
            expiresAt,
          },
        });
      }
      return session ? mapSession(session) : null;
    });
  }

  async listSessions(userId: string): Promise<SessionRecord[]> {
    const sessions = await this.client.session.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastUsedAt: "desc" },
    });
    return sessions.map(mapSession);
  }

  async revokeSession(sessionId: string, userId: string, revokedAt: Date): Promise<boolean> {
    const result = await this.client.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt },
    });
    return result.count === 1;
  }

  async revokeSessionFamily(tokenFamilyId: string, revokedAt: Date): Promise<void> {
    await this.client.session.updateMany({
      where: { tokenFamilyId, revokedAt: null },
      data: { revokedAt },
    });
  }

  async revokeAllSessions(userId: string, revokedAt: Date): Promise<void> {
    await this.client.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });
  }

  async createOtpChallenge(input: CreateOtpChallengeInput): Promise<OtpChallengeRecord> {
    return this.client.$transaction(async (transaction) => {
      await transaction.otpChallenge.updateMany({
        where: { email: input.email, purpose: input.purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      return mapOtp(
        await transaction.otpChallenge.create({
          data: {
            userId: input.userId ?? null,
            email: input.email,
            purpose: input.purpose,
            codeHash: input.codeHash,
            expiresAt: input.expiresAt,
          },
        }),
      );
    });
  }

  async findLatestOtpChallenge(
    email: string,
    purpose: OtpPurpose,
  ): Promise<OtpChallengeRecord | null> {
    const challenge = await this.client.otpChallenge.findFirst({
      where: { email, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return challenge ? mapOtp(challenge) : null;
  }

  async applyOtpAttempt(
    challengeId: string,
    valid: boolean,
    maxAttempts: number,
    attemptedAt: Date,
  ): Promise<boolean> {
    if (valid) {
      const consumed = await this.client.otpChallenge.updateMany({
        where: {
          id: challengeId,
          consumedAt: null,
          expiresAt: { gt: attemptedAt },
          attempts: { lt: maxAttempts },
        },
        data: { consumedAt: attemptedAt },
      });
      return consumed.count === 1;
    }

    const attempted = await this.client.otpChallenge.updateMany({
      where: {
        id: challengeId,
        consumedAt: null,
        expiresAt: { gt: attemptedAt },
        attempts: { lt: maxAttempts },
      },
      data: { attempts: { increment: 1 } },
    });
    if (attempted.count === 0) return false;
    await this.client.otpChallenge.updateMany({
      where: { id: challengeId, consumedAt: null, attempts: { gte: maxAttempts } },
      data: { consumedAt: attemptedAt },
    });
    return false;
  }

  async createDefaultPreferences(
    userId: string,
    locale: "en" | "ur",
  ): Promise<UserPreferenceRecord> {
    const preference = await this.client.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        interfaceLocale: locale,
        translationEditionId: locale === "ur" ? "ur.jalandhry" : "en.sahih",
      },
      update: {},
    });
    return mapPreference(preference);
  }

  async findPreferences(userId: string): Promise<UserPreferenceRecord | null> {
    const preference = await this.client.userPreference.findUnique({ where: { userId } });
    return preference ? mapPreference(preference) : null;
  }

  async updatePreferences(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferenceRecord> {
    return mapPreference(
      await this.client.userPreference.upsert({
        where: { userId },
        create: { userId, ...input },
        update: input,
      }),
    );
  }

  async saveReadingPosition(
    input: Omit<ReadingPositionRecord, "id" | "updatedAt">,
  ): Promise<ReadingPositionRecord> {
    return mapReadingPosition(
      await this.client.readingPosition.upsert({
        where: {
          userId_surahNumber: { userId: input.userId, surahNumber: input.surahNumber },
        },
        create: input,
        update: {
          ayahNumber: input.ayahNumber,
          mode: input.mode,
        },
      }),
    );
  }

  async findLatestReadingPosition(userId: string): Promise<ReadingPositionRecord | null> {
    const position = await this.client.readingPosition.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return position ? mapReadingPosition(position) : null;
  }

  async addBookmark(input: Omit<BookmarkRecord, "id" | "createdAt">): Promise<BookmarkRecord> {
    return mapBookmark(await this.client.bookmark.create({ data: input }));
  }

  async appendLearningEvent(
    input: Omit<LearningEventRecord, "id" | "recordedAt">,
  ): Promise<LearningEventRecord> {
    return mapLearningEvent(
      await this.client.learningEvent.create({
        data: {
          ...input,
          payload: input.payload as Prisma.InputJsonValue,
        },
      }),
    );
  }

  async createContentRelease(
    input: Omit<ContentReleaseRecord, "createdAt">,
  ): Promise<ContentReleaseRecord> {
    return mapContentRelease(
      await this.client.contentRelease.create({
        data: {
          ...input,
          manifest: input.manifest as Prisma.InputJsonValue,
        },
      }),
    );
  }

  async findContentRelease(id: string): Promise<ContentReleaseRecord | null> {
    const release = await this.client.contentRelease.findUnique({ where: { id } });
    return release ? mapContentRelease(release) : null;
  }

  async createKhatmRoom(input: CreateKhatmRoomRecordInput): Promise<KhatmRoomDetailRecord> {
    try {
      return await this.client.$transaction(async (transaction) => {
        const room = await transaction.khatmRoom.create({
          data: {
            name: input.name,
            intention: input.intention ?? null,
            targetKhatms: input.targetKhatms,
            startDate: input.startDate ?? null,
            deadline: input.deadline ?? null,
            inviteCode: input.inviteCode,
            joinCode: input.joinCode ?? input.inviteCode.slice(0, 8).toUpperCase(),
            recurrence: input.recurrence ?? "NONE",
            autoRestartOnComplete: input.autoRestartOnComplete ?? false,
            maxActiveParasPerMember: input.maxActiveParasPerMember ?? 4,
            reminderCadence: input.reminderCadence ?? "NONE",
            ownerUserId: input.ownerUserId,
          },
        });
        await transaction.khatmRoomMember.create({
          data: { roomId: room.id, userId: input.ownerUserId, role: "OWNER" },
        });
        const campaign = await createKhatmCampaign(transaction, {
          roomId: room.id,
          number: 1,
          targetKhatms: input.targetKhatms,
          startDate: input.startDate ?? null,
          deadline: input.deadline ?? null,
        });
        await transaction.khatmActivity.createMany({
          data: [
            {
              roomId: room.id,
              campaignId: campaign.id,
              actorUserId: input.ownerUserId,
              type: "ROOM_CREATED",
            },
            {
              roomId: room.id,
              campaignId: campaign.id,
              actorUserId: input.ownerUserId,
              type: "CAMPAIGN_STARTED",
            },
          ],
        });
        const created = await transaction.khatmRoom.findUniqueOrThrow({
          where: { id: room.id },
          include: khatmRoomDetailInclude,
        });
        return mapKhatmRoomDetail(created, input.ownerUserId);
      });
    } catch (error) {
      if (hasPrismaCode(error, "P2002")) {
        throw new RepositoryConflictError("Invitation code already exists");
      }
      throw error;
    }
  }

  async listKhatmRooms(userId: string): Promise<KhatmRoomSummaryRecord[]> {
    const rooms = await this.client.khatmRoom.findMany({
      where: { members: { some: { userId } } },
      include: khatmRoomSummaryInclude,
      orderBy: { createdAt: "desc" },
    });
    return rooms.map((room) => mapKhatmRoomSummary(room, userId));
  }

  async findKhatmRoomForMember(
    roomId: string,
    userId: string,
  ): Promise<KhatmRoomDetailRecord | null> {
    const room = await this.client.khatmRoom.findFirst({
      where: { id: roomId, members: { some: { userId } } },
      include: khatmRoomDetailInclude,
    });
    return room ? mapKhatmRoomDetail(room, userId) : null;
  }

  async findKhatmInvitePreview(credential: string): Promise<KhatmInvitePreviewRecord | null> {
    const room = await this.client.khatmRoom.findFirst({
      where: {
        OR: [{ inviteCode: credential }, { joinCode: credential.trim().toUpperCase() }],
      },
      include: {
        _count: { select: { members: true } },
        campaigns: {
          where: { status: "ACTIVE" },
          take: 1,
          include: { slots: { select: { status: true } } },
        },
      },
    });
    if (!room) return null;
    const slots = room.campaigns[0]?.slots ?? [];
    return {
      name: room.name,
      intention: room.intention,
      deadline: room.deadline,
      recurrence: room.recurrence,
      memberCount: room._count.members,
      targetKhatms: room.targetKhatms,
      completedSlots: slots.filter((slot) => slot.status === "COMPLETED").length,
      totalSlots: slots.length,
      joinCode: room.joinCode,
    };
  }

  async joinKhatmRoomByInviteCode(
    credential: string,
    userId: string,
  ): Promise<KhatmRoomDetailRecord> {
    return this.client.$transaction(async (transaction) => {
      const room = await transaction.khatmRoom.findFirst({
        where: {
          OR: [{ inviteCode: credential }, { joinCode: credential.trim().toUpperCase() }],
        },
      });
      if (!room) throw new KhatmRepositoryError("ROOM_NOT_FOUND", "Khatm room not found");
      const inserted = await transaction.khatmRoomMember.createMany({
        data: [{ roomId: room.id, userId, role: "MEMBER" }],
        skipDuplicates: true,
      });
      if (inserted.count === 1) {
        await transaction.khatmActivity.create({
          data: {
            roomId: room.id,
            actorUserId: userId,
            targetUserId: userId,
            type: "MEMBER_JOINED",
          },
        });
      }
      const joined = await transaction.khatmRoom.findUniqueOrThrow({
        where: { id: room.id },
        include: khatmRoomDetailInclude,
      });
      return mapKhatmRoomDetail(joined, userId);
    });
  }

  async updateKhatmRoom(input: UpdateKhatmRoomRecordInput): Promise<KhatmRoomDetailRecord> {
    return this.client.$transaction(async (transaction) => {
      const membership = await transaction.khatmRoomMember.findUnique({
        where: { roomId_userId: { roomId: input.roomId, userId: input.actorUserId } },
      });
      if (!membership) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
      if (membership.role !== "OWNER") {
        throw new KhatmRepositoryError("NOT_OWNER", "Only the room owner can make this change");
      }
      if (input.maxActiveParasPerMember !== undefined) {
        const active = await transaction.khatmCampaign.findFirst({
          where: { roomId: input.roomId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!active) throw new KhatmRepositoryError("CAMPAIGN_NOT_FOUND", "No active campaign");
        const grouped = await transaction.khatmParaSlot.groupBy({
          by: ["claimedByUserId"],
          where: {
            campaignId: active.id,
            claimedByUserId: { not: null },
            status: { in: ["CLAIMED", "READING"] },
          },
          _count: true,
        });
        const highest = grouped.reduce((value, group) => Math.max(value, group._count), 0);
        if (input.maxActiveParasPerMember < highest) {
          throw new KhatmRepositoryError(
            "ACTIVE_PARA_LIMIT",
            "Release assignments before lowering the active Para limit",
          );
        }
      }
      const data: Prisma.KhatmRoomUncheckedUpdateInput = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.intention !== undefined) data.intention = input.intention;
      if (input.targetKhatms !== undefined) data.targetKhatms = input.targetKhatms;
      if (input.startDate !== undefined) data.startDate = input.startDate;
      if (input.deadline !== undefined) data.deadline = input.deadline;
      if (input.recurrence !== undefined) data.recurrence = input.recurrence;
      if (input.autoRestartOnComplete !== undefined) {
        data.autoRestartOnComplete = input.autoRestartOnComplete;
      }
      if (input.maxActiveParasPerMember !== undefined) {
        data.maxActiveParasPerMember = input.maxActiveParasPerMember;
      }
      if (input.reminderCadence !== undefined) data.reminderCadence = input.reminderCadence;
      await transaction.khatmRoom.update({
        where: { id: input.roomId },
        data,
      });
      await transaction.khatmActivity.create({
        data: { roomId: input.roomId, actorUserId: input.actorUserId, type: "ROOM_UPDATED" },
      });
      const updated = await transaction.khatmRoom.findUniqueOrThrow({
        where: { id: input.roomId },
        include: khatmRoomDetailInclude,
      });
      return mapKhatmRoomDetail(updated, input.actorUserId);
    });
  }

  async rotateKhatmInvitation(
    roomId: string,
    actorUserId: string,
    inviteCode: string,
    joinCode: string,
  ): Promise<KhatmRoomDetailRecord> {
    try {
      return await this.client.$transaction(async (transaction) => {
        const membership = await transaction.khatmRoomMember.findUnique({
          where: { roomId_userId: { roomId, userId: actorUserId } },
        });
        if (!membership) {
          throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
        }
        if (membership.role !== "OWNER") {
          throw new KhatmRepositoryError("NOT_OWNER", "Only the room owner can rotate invites");
        }
        await transaction.khatmRoom.update({
          where: { id: roomId },
          data: { inviteCode, joinCode },
        });
        await transaction.khatmActivity.create({
          data: { roomId, actorUserId, type: "INVITE_ROTATED" },
        });
        const updated = await transaction.khatmRoom.findUniqueOrThrow({
          where: { id: roomId },
          include: khatmRoomDetailInclude,
        });
        return mapKhatmRoomDetail(updated, actorUserId);
      });
    } catch (error) {
      if (hasPrismaCode(error, "P2002")) {
        throw new RepositoryConflictError("Invitation code already exists");
      }
      throw error;
    }
  }

  async removeKhatmMember(
    roomId: string,
    actorUserId: string,
    memberUserId: string,
  ): Promise<void> {
    await this.client.$transaction(async (transaction) => {
      const memberships = await transaction.khatmRoomMember.findMany({
        where: { roomId, userId: { in: [actorUserId, memberUserId] } },
      });
      const actor = memberships.find((member) => member.userId === actorUserId);
      const member = memberships.find((candidate) => candidate.userId === memberUserId);
      if (!actor) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
      if (!member) throw new KhatmRepositoryError("MEMBER_NOT_FOUND", "Room member not found");
      if (member.role === "OWNER") {
        throw new KhatmRepositoryError("OWNER_CANNOT_LEAVE", "Transfer ownership before leaving");
      }
      if (actor.role !== "OWNER" && actorUserId !== memberUserId) {
        throw new KhatmRepositoryError("NOT_OWNER", "Only the owner can remove another member");
      }
      const active = await transaction.khatmCampaign.findFirst({
        where: { roomId, status: "ACTIVE" },
        select: { id: true },
      });
      if (active) {
        await transaction.khatmParaSlot.updateMany({
          where: {
            campaignId: active.id,
            claimedByUserId: memberUserId,
            status: { in: ["CLAIMED", "READING"] },
          },
          data: {
            status: "AVAILABLE",
            claimedByUserId: null,
            claimedAt: null,
            readingStartedAt: null,
            completedAt: null,
            assignedByUserId: null,
          },
        });
      }
      await transaction.khatmRoomMember.delete({
        where: { roomId_userId: { roomId, userId: memberUserId } },
      });
      await transaction.khatmActivity.create({
        data: {
          roomId,
          actorUserId,
          targetUserId: memberUserId,
          type: "MEMBER_REMOVED",
        },
      });
    });
  }

  async listKhatmCampaigns(roomId: string, userId: string): Promise<KhatmCampaignSummaryRecord[]> {
    const membership = await this.client.khatmRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) {
      throw new KhatmRepositoryError("NOT_MEMBER", "You are not a member of this Khatm room");
    }
    const campaigns = await this.client.khatmCampaign.findMany({
      where: { roomId },
      orderBy: { number: "desc" },
      include: { slots: { select: { status: true } } },
    });
    return campaigns.map((campaign) => ({
      id: campaign.id,
      roomId: campaign.roomId,
      number: campaign.number,
      status: campaign.status,
      targetKhatms: campaign.targetKhatms,
      deadline: campaign.deadline,
      createdAt: campaign.createdAt,
      endedAt: campaign.endedAt,
      completedSlots: campaign.slots.filter((slot) => slot.status === "COMPLETED").length,
      totalSlots: campaign.slots.length,
    }));
  }

  async startNextKhatmCampaign(
    input: StartNextKhatmCampaignRecordInput,
  ): Promise<KhatmRoomDetailRecord> {
    return this.client.$transaction(async (transaction) => {
      const membership = await transaction.khatmRoomMember.findUnique({
        where: { roomId_userId: { roomId: input.roomId, userId: input.actorUserId } },
      });
      if (!membership) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
      if (membership.role !== "OWNER") {
        throw new KhatmRepositoryError("NOT_OWNER", "Only the room owner can start a campaign");
      }
      const room = await transaction.khatmRoom.findUnique({ where: { id: input.roomId } });
      if (!room) throw new KhatmRepositoryError("ROOM_NOT_FOUND", "Khatm room not found");
      const active = await transaction.khatmCampaign.findFirst({
        where: { roomId: room.id, status: "ACTIVE" },
        include: { slots: { select: { status: true } } },
      });
      if (!active) throw new KhatmRepositoryError("CAMPAIGN_NOT_FOUND", "No active campaign");
      const isComplete = active.slots.every((slot) => slot.status === "COMPLETED");
      if (!isComplete && !input.cancelCurrent) {
        throw new KhatmRepositoryError(
          "CAMPAIGN_NOT_READY",
          "Complete every Para or explicitly cancel this campaign",
        );
      }
      await transaction.khatmCampaign.update({
        where: { id: active.id },
        data: { status: isComplete ? "COMPLETED" : "CANCELLED", endedAt: input.occurredAt },
      });
      await transaction.khatmActivity.create({
        data: {
          roomId: room.id,
          campaignId: active.id,
          actorUserId: input.actorUserId,
          type: isComplete ? "CAMPAIGN_COMPLETED" : "CAMPAIGN_CANCELLED",
          occurredAt: input.occurredAt,
        },
      });
      const deadline =
        input.deadline !== undefined
          ? input.deadline
          : nextRecurringDeadline(
              room.recurrence,
              active.deadline ?? room.deadline,
              input.occurredAt,
            );
      const nextCampaign = await createKhatmCampaign(transaction, {
        roomId: room.id,
        number: active.number + 1,
        targetKhatms: room.targetKhatms,
        deadline,
        createdAt: input.occurredAt,
      });
      await transaction.khatmActivity.create({
        data: {
          roomId: room.id,
          campaignId: nextCampaign.id,
          actorUserId: input.actorUserId,
          type: "CAMPAIGN_STARTED",
          occurredAt: input.occurredAt,
        },
      });
      await transaction.khatmRoom.update({ where: { id: room.id }, data: { deadline } });
      const updated = await transaction.khatmRoom.findUniqueOrThrow({
        where: { id: room.id },
        include: khatmRoomDetailInclude,
      });
      return mapKhatmRoomDetail(updated, input.actorUserId);
    });
  }

  async mutateKhatmSlot(input: MutateKhatmSlotInput): Promise<KhatmParaSlotRecord> {
    return this.client.$transaction(async (transaction) => {
      const membership = await transaction.khatmRoomMember.findUnique({
        where: { roomId_userId: { roomId: input.roomId, userId: input.userId } },
        include: {
          room: {
            select: {
              maxActiveParasPerMember: true,
              recurrence: true,
              targetKhatms: true,
              deadline: true,
            },
          },
        },
      });
      if (!membership) {
        throw new KhatmRepositoryError("NOT_MEMBER", "You are not a member of this Khatm room");
      }
      const campaign = await transaction.khatmCampaign.findFirst({
        where: { id: input.campaignId, roomId: input.roomId, status: "ACTIVE" },
        select: { id: true, number: true, deadline: true },
      });
      if (!campaign) {
        throw new KhatmRepositoryError("CAMPAIGN_NOT_FOUND", "Khatm campaign not found");
      }
      const slot = await transaction.khatmParaSlot.findUnique({
        where: {
          campaignId_khatmNumber_juzNumber: {
            campaignId: input.campaignId,
            khatmNumber: input.khatmNumber,
            juzNumber: input.juzNumber,
          },
        },
      });
      if (!slot) throw new KhatmRepositoryError("SLOT_NOT_FOUND", "Para slot not found");

      if (input.action === "CLAIM") {
        // Serialize claims by one member, including claims for different slots, so
        // two concurrent requests cannot exceed the room's active-Para limit.
        await transaction.$queryRaw`
          SELECT "user_id"
          FROM "khatm_room_members"
          WHERE "room_id" = ${input.roomId}::uuid AND "user_id" = ${input.userId}::uuid
          FOR UPDATE
        `;
        const activeCount = await transaction.khatmParaSlot.count({
          where: {
            campaignId: campaign.id,
            claimedByUserId: input.userId,
            status: { in: ["CLAIMED", "READING"] },
          },
        });
        if (activeCount >= membership.room.maxActiveParasPerMember) {
          throw new KhatmRepositoryError(
            "ACTIVE_PARA_LIMIT",
            `You can have up to ${membership.room.maxActiveParasPerMember} active Paras`,
          );
        }
        const claimed = await transaction.khatmParaSlot.updateMany({
          where: { id: slot.id, status: "AVAILABLE", claimedByUserId: null },
          data: {
            status: "CLAIMED",
            claimedByUserId: input.userId,
            claimedAt: input.occurredAt,
            readingStartedAt: null,
            completedAt: null,
            assignedByUserId: input.userId,
          },
        });
        if (claimed.count !== 1) {
          throw new KhatmRepositoryError("SLOT_UNAVAILABLE", "This Para has already been claimed");
        }
      } else {
        const allowedStatuses =
          input.action === "MARK_READING"
            ? (["CLAIMED"] as const)
            : (["CLAIMED", "READING"] as const);
        const data: Prisma.KhatmParaSlotUncheckedUpdateManyInput =
          input.action === "RELEASE"
            ? {
                status: "AVAILABLE",
                claimedByUserId: null,
                claimedAt: null,
                readingStartedAt: null,
                completedAt: null,
                assignedByUserId: null,
              }
            : input.action === "MARK_READING"
              ? { status: "READING", readingStartedAt: input.occurredAt }
              : { status: "COMPLETED", completedAt: input.occurredAt };
        const changed = await transaction.khatmParaSlot.updateMany({
          where: {
            id: slot.id,
            claimedByUserId: input.userId,
            status: { in: [...allowedStatuses] },
          },
          data,
        });
        if (changed.count !== 1) {
          const current = await transaction.khatmParaSlot.findUniqueOrThrow({
            where: { id: slot.id },
          });
          if (current.claimedByUserId !== input.userId) {
            throw new KhatmRepositoryError(
              "NOT_CLAIMANT",
              "This Para is assigned to another member",
            );
          }
          throw new KhatmRepositoryError(
            "INVALID_SLOT_STATE",
            "This Para cannot make that transition",
          );
        }
      }

      const activityType = {
        CLAIM: "PARA_CLAIMED",
        RELEASE: "PARA_RELEASED",
        MARK_READING: "PARA_READING",
        COMPLETE: "PARA_COMPLETED",
      } as const;
      await transaction.khatmActivity.create({
        data: {
          roomId: input.roomId,
          campaignId: campaign.id,
          slotId: slot.id,
          actorUserId: input.userId,
          targetUserId: input.userId,
          type: activityType[input.action],
          khatmNumber: input.khatmNumber,
          juzNumber: input.juzNumber,
          occurredAt: input.occurredAt,
        },
      });

      if (input.action === "COMPLETE" && membership.room.recurrence !== "NONE") {
        const remaining = await transaction.khatmParaSlot.count({
          where: { campaignId: campaign.id, status: { not: "COMPLETED" } },
        });
        if (remaining === 0) {
          const closed = await transaction.khatmCampaign.updateMany({
            where: { id: campaign.id, status: "ACTIVE" },
            data: { status: "COMPLETED", endedAt: input.occurredAt },
          });
          if (closed.count === 1) {
            await transaction.khatmActivity.create({
              data: {
                roomId: input.roomId,
                campaignId: campaign.id,
                actorUserId: input.userId,
                type: "CAMPAIGN_COMPLETED",
                occurredAt: input.occurredAt,
              },
            });
            const deadline = nextRecurringDeadline(
              membership.room.recurrence,
              campaign.deadline ?? membership.room.deadline,
              input.occurredAt,
            );
            const nextCampaign = await createKhatmCampaign(transaction, {
              roomId: input.roomId,
              number: campaign.number + 1,
              targetKhatms: membership.room.targetKhatms,
              deadline,
              createdAt: input.occurredAt,
            });
            await transaction.khatmActivity.create({
              data: {
                roomId: input.roomId,
                campaignId: nextCampaign.id,
                actorUserId: input.userId,
                type: "CAMPAIGN_STARTED",
                occurredAt: input.occurredAt,
              },
            });
            await transaction.khatmRoom.update({
              where: { id: input.roomId },
              data: { deadline },
            });
          }
        }
      }

      return mapKhatmSlot(
        await transaction.khatmParaSlot.findUniqueOrThrow({ where: { id: slot.id } }),
      );
    });
  }

  async adminAssignKhatmSlot(input: AdminAssignKhatmSlotInput): Promise<KhatmParaSlotRecord> {
    return this.client.$transaction(async (transaction) => {
      const actor = await transaction.khatmRoomMember.findUnique({
        where: { roomId_userId: { roomId: input.roomId, userId: input.actorUserId } },
        include: { room: { select: { maxActiveParasPerMember: true } } },
      });
      if (!actor) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
      if (actor.role !== "OWNER") {
        throw new KhatmRepositoryError("NOT_OWNER", "Only the room owner can assign Paras");
      }
      const campaign = await transaction.khatmCampaign.findFirst({
        where: { id: input.campaignId, roomId: input.roomId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!campaign) {
        throw new KhatmRepositoryError("CAMPAIGN_NOT_FOUND", "Khatm campaign not found");
      }
      const slot = await transaction.khatmParaSlot.findUnique({
        where: {
          campaignId_khatmNumber_juzNumber: {
            campaignId: campaign.id,
            khatmNumber: input.khatmNumber,
            juzNumber: input.juzNumber,
          },
        },
      });
      if (!slot) throw new KhatmRepositoryError("SLOT_NOT_FOUND", "Para slot not found");
      if (slot.status === "COMPLETED" && !input.reopenCompleted) {
        throw new KhatmRepositoryError("INVALID_SLOT_STATE", "Undo completion before reassigning");
      }
      const wasCompleted = slot.status === "COMPLETED";
      if (input.userId === null) {
        const released = await transaction.khatmParaSlot.update({
          where: { id: slot.id },
          data: {
            status: "AVAILABLE",
            claimedByUserId: null,
            claimedAt: null,
            readingStartedAt: null,
            completedAt: null,
            assignedByUserId: null,
          },
        });
        await transaction.khatmActivity.create({
          data: {
            roomId: input.roomId,
            campaignId: campaign.id,
            slotId: slot.id,
            actorUserId: input.actorUserId,
            type: wasCompleted ? "COMPLETION_REOPENED" : "PARA_RELEASED",
            khatmNumber: input.khatmNumber,
            juzNumber: input.juzNumber,
            occurredAt: input.occurredAt,
          },
        });
        return mapKhatmSlot(released);
      }
      await transaction.$queryRaw`
        SELECT "user_id"
        FROM "khatm_room_members"
        WHERE "room_id" = ${input.roomId}::uuid AND "user_id" = ${input.userId}::uuid
        FOR UPDATE
      `;
      const target = await transaction.khatmRoomMember.findUnique({
        where: { roomId_userId: { roomId: input.roomId, userId: input.userId } },
      });
      if (!target) {
        throw new KhatmRepositoryError("MEMBER_NOT_FOUND", "Assign Paras only to room members");
      }
      if (slot.claimedByUserId !== input.userId) {
        const activeCount = await transaction.khatmParaSlot.count({
          where: {
            campaignId: campaign.id,
            claimedByUserId: input.userId,
            status: { in: ["CLAIMED", "READING"] },
          },
        });
        if (activeCount >= actor.room.maxActiveParasPerMember) {
          throw new KhatmRepositoryError(
            "ACTIVE_PARA_LIMIT",
            "This member has reached the active Para limit",
          );
        }
      }
      const assigned = await transaction.khatmParaSlot.update({
        where: { id: slot.id },
        data: {
          status: "CLAIMED",
          claimedByUserId: input.userId,
          claimedAt: input.occurredAt,
          readingStartedAt: null,
          completedAt: null,
          assignedByUserId: input.actorUserId,
        },
      });
      await transaction.khatmActivity.create({
        data: {
          roomId: input.roomId,
          campaignId: campaign.id,
          slotId: slot.id,
          actorUserId: input.actorUserId,
          targetUserId: input.userId,
          type: wasCompleted ? "COMPLETION_REOPENED" : "PARA_REASSIGNED",
          khatmNumber: input.khatmNumber,
          juzNumber: input.juzNumber,
          occurredAt: input.occurredAt,
        },
      });
      return mapKhatmSlot(assigned);
    });
  }

  async scheduleKhatmReminder(
    input: ScheduleKhatmReminderRecordInput,
  ): Promise<KhatmReminderRecord> {
    return this.client.$transaction(async (transaction) => {
      const actor = await transaction.khatmRoomMember.findUnique({
        where: { roomId_userId: { roomId: input.roomId, userId: input.actorUserId } },
      });
      if (!actor) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
      if (actor.role !== "OWNER") {
        throw new KhatmRepositoryError("NOT_OWNER", "Only the room owner can schedule reminders");
      }
      const campaign = await transaction.khatmCampaign.findFirst({
        where: { roomId: input.roomId, status: "ACTIVE" },
        select: { id: true },
      });
      const reminder = await transaction.khatmReminder.create({
        data: {
          roomId: input.roomId,
          campaignId: campaign?.id ?? null,
          createdByUserId: input.actorUserId,
          scheduledFor: input.scheduledFor,
          message: input.message,
        },
      });
      await transaction.khatmActivity.create({
        data: {
          roomId: input.roomId,
          campaignId: campaign?.id ?? null,
          actorUserId: input.actorUserId,
          type: "REMINDER_SCHEDULED",
        },
      });
      return mapKhatmReminder(reminder);
    });
  }

  async listKhatmReminders(roomId: string, userId: string): Promise<KhatmReminderRecord[]> {
    const membership = await this.client.khatmRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership) {
      throw new KhatmRepositoryError("NOT_MEMBER", "You are not a member of this Khatm room");
    }
    return (
      await this.client.khatmReminder.findMany({
        where: { roomId },
        orderBy: { scheduledFor: "asc" },
      })
    ).map(mapKhatmReminder);
  }

  async cancelKhatmReminder(
    roomId: string,
    reminderId: string,
    actorUserId: string,
    occurredAt: Date,
  ): Promise<KhatmReminderRecord> {
    return this.client.$transaction(async (transaction) => {
      const actor = await transaction.khatmRoomMember.findUnique({
        where: { roomId_userId: { roomId, userId: actorUserId } },
      });
      if (!actor) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
      if (actor.role !== "OWNER") {
        throw new KhatmRepositoryError("NOT_OWNER", "Only the room owner can cancel reminders");
      }
      const changed = await transaction.khatmReminder.updateMany({
        where: { id: reminderId, roomId, status: "PENDING" },
        data: { status: "CANCELLED", cancelledAt: occurredAt },
      });
      if (changed.count !== 1) {
        const reminder = await transaction.khatmReminder.findFirst({
          where: { id: reminderId, roomId },
        });
        if (!reminder) {
          throw new KhatmRepositoryError("REMINDER_NOT_FOUND", "Khatm reminder not found");
        }
        throw new KhatmRepositoryError(
          "REMINDER_STATE_CONFLICT",
          "Only a pending reminder can be cancelled",
        );
      }
      await transaction.khatmActivity.create({
        data: {
          roomId,
          actorUserId,
          type: "REMINDER_CANCELLED",
          occurredAt,
        },
      });
      return mapKhatmReminder(
        await transaction.khatmReminder.findUniqueOrThrow({ where: { id: reminderId } }),
      );
    });
  }

  async findDueKhatmReminders(now: Date): Promise<KhatmReminderRecord[]> {
    const reminders = await this.client.khatmReminder.findMany({
      where: {
        status: "PENDING",
        scheduledFor: { lte: now },
      },
      orderBy: { scheduledFor: "asc" },
    });
    return reminders.map(mapKhatmReminder);
  }

  async markKhatmReminderSent(reminderId: string, sentAt: Date): Promise<KhatmReminderRecord> {
    const updated = await this.client.khatmReminder.update({
      where: { id: reminderId },
      data: { status: "SENT", sentAt },
    });
    return mapKhatmReminder(updated);
  }
}

export interface PrismaRepositoryHandle {
  repository: PrismaRepository;
  close: () => Promise<void>;
}

export function createPrismaRepository(databaseUrl: string): PrismaRepositoryHandle {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const client = new PrismaClient({ adapter });
  return {
    repository: new PrismaRepository(client),
    close: () => client.$disconnect(),
  };
}
