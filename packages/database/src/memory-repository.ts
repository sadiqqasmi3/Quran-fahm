import { randomUUID } from "node:crypto";
import type {
  AdminAssignKhatmSlotInput,
  BookmarkRecord,
  ContentReleaseRecord,
  CreateKhatmRoomRecordInput,
  CreateOtpChallengeInput,
  CreateSessionInput,
  CreateUserInput,
  KhatmActivityRecord,
  KhatmActivityType,
  KhatmCampaignRecord,
  KhatmCampaignSummaryRecord,
  KhatmInvitePreviewRecord,
  KhatmMemberRecord,
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

const cloneDate = (value: Date): Date => new Date(value.getTime());

function cloneUser(user: UserRecord): UserRecord {
  return {
    ...user,
    emailVerifiedAt: user.emailVerifiedAt ? cloneDate(user.emailVerifiedAt) : null,
    createdAt: cloneDate(user.createdAt),
    updatedAt: cloneDate(user.updatedAt),
  };
}

function cloneSession(session: SessionRecord): SessionRecord {
  return {
    ...session,
    rotatedAt: session.rotatedAt ? cloneDate(session.rotatedAt) : null,
    createdAt: cloneDate(session.createdAt),
    lastUsedAt: cloneDate(session.lastUsedAt),
    expiresAt: cloneDate(session.expiresAt),
    revokedAt: session.revokedAt ? cloneDate(session.revokedAt) : null,
  };
}

export class MemoryRepository implements QuranFehamRepository {
  readonly users = new Map<string, UserRecord>();
  readonly sessions = new Map<string, SessionRecord>();
  readonly rotatedRefreshTokens = new Map<
    string,
    { sessionId: string; tokenFamilyId: string; expiresAt: Date }
  >();
  readonly otpChallenges = new Map<string, OtpChallengeRecord>();
  readonly preferences = new Map<string, UserPreferenceRecord>();
  readonly readingPositions = new Map<string, ReadingPositionRecord>();
  readonly bookmarks = new Map<string, BookmarkRecord>();
  readonly learningEvents = new Map<string, LearningEventRecord>();
  readonly contentReleases = new Map<string, ContentReleaseRecord>();
  readonly khatmRooms = new Map<
    string,
    {
      id: string;
      name: string;
      intention: string | null;
      targetKhatms: number;
      startDate: Date | null;
      deadline: Date | null;
      inviteCode: string;
      joinCode: string;
      recurrence: KhatmRecurrence;
      autoRestartOnComplete: boolean;
      maxActiveParasPerMember: number;
      reminderCadence: "NONE" | "DAILY" | "DEADLINE_3_DAYS" | "DEADLINE_1_DAY";
      ownerUserId: string;
      createdAt: Date;
      updatedAt: Date;
    }
  >();
  readonly khatmMembers = new Map<
    string,
    { roomId: string; userId: string; role: "OWNER" | "MEMBER"; joinedAt: Date }
  >();
  readonly khatmCampaigns = new Map<string, Omit<KhatmCampaignRecord, "slots">>();
  readonly khatmSlots = new Map<string, KhatmParaSlotRecord>();
  readonly khatmReminders = new Map<string, KhatmReminderRecord>();
  readonly khatmActivities = new Map<string, KhatmActivityRecord>();

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const email = input.email.trim().toLowerCase();
    if ([...this.users.values()].some((user) => user.email === email)) {
      throw new RepositoryConflictError("A user with this email already exists");
    }

    const now = new Date();
    const user: UserRecord = {
      id: randomUUID(),
      email,
      passwordHash: input.passwordHash,
      displayName: input.displayName ?? null,
      locale: input.locale,
      role: "LEARNER",
      emailVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return cloneUser(user);
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? cloneUser(user) : null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    const user = [...this.users.values()].find((candidate) => candidate.email === normalized);
    return user ? cloneUser(user) : null;
  }

  async markEmailVerified(userId: string, verifiedAt: Date): Promise<UserRecord> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    user.emailVerifiedAt = cloneDate(verifiedAt);
    user.updatedAt = cloneDate(verifiedAt);
    return cloneUser(user);
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
  }

  async createSession(input: CreateSessionInput): Promise<SessionRecord> {
    if (
      [...this.sessions.values()].some(
        (session) => session.refreshTokenHash === input.refreshTokenHash,
      )
    ) {
      throw new RepositoryConflictError("Refresh token digest already exists");
    }
    const now = new Date();
    const session: SessionRecord = {
      id: randomUUID(),
      userId: input.userId,
      tokenFamilyId: input.tokenFamilyId,
      refreshTokenHash: input.refreshTokenHash,
      previousRefreshTokenHash: null,
      rotatedAt: null,
      deviceName: input.deviceName,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      createdAt: now,
      lastUsedAt: now,
      expiresAt: cloneDate(input.expiresAt),
      revokedAt: null,
    };
    this.sessions.set(session.id, session);
    return cloneSession(session);
  }

  async findSessionById(sessionId: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(sessionId);
    return session ? cloneSession(session) : null;
  }

  async findSessionByRefreshTokenHash(hash: string): Promise<SessionWithUser | null> {
    const session = [...this.sessions.values()].find(
      (candidate) => candidate.refreshTokenHash === hash,
    );
    if (!session) {
      const rotated = this.rotatedRefreshTokens.get(hash);
      if (!rotated) return null;
      if (rotated.expiresAt <= new Date()) {
        this.rotatedRefreshTokens.delete(hash);
        return null;
      }
      const rotatedSession = this.sessions.get(rotated.sessionId);
      if (!rotatedSession) return null;
      const rotatedUser = this.users.get(rotatedSession.userId);
      if (!rotatedUser) return null;
      return {
        session: cloneSession(rotatedSession),
        user: cloneUser(rotatedUser),
        matched: "rotated",
      };
    }
    const user = this.users.get(session.userId);
    if (!user) return null;
    return {
      session: cloneSession(session),
      user: cloneUser(user),
      matched: "current",
    };
  }

  async rotateSession(
    sessionId: string,
    expectedHash: string,
    nextHash: string,
    usedAt: Date,
    expiresAt: Date,
  ): Promise<SessionRecord | null> {
    const session = this.sessions.get(sessionId);
    if (
      !session ||
      session.revokedAt ||
      session.refreshTokenHash !== expectedHash ||
      session.expiresAt <= usedAt
    ) {
      return null;
    }
    this.rotatedRefreshTokens.set(session.refreshTokenHash, {
      sessionId: session.id,
      tokenFamilyId: session.tokenFamilyId,
      expiresAt: cloneDate(session.expiresAt),
    });
    session.previousRefreshTokenHash = session.refreshTokenHash;
    session.refreshTokenHash = nextHash;
    session.rotatedAt = cloneDate(usedAt);
    session.lastUsedAt = cloneDate(usedAt);
    session.expiresAt = cloneDate(expiresAt);
    return cloneSession(session);
  }

  async listSessions(userId: string): Promise<SessionRecord[]> {
    return [...this.sessions.values()]
      .filter((session) => session.userId === userId && !session.revokedAt)
      .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
      .map(cloneSession);
  }

  async revokeSession(sessionId: string, userId: string, revokedAt: Date): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId || session.revokedAt) return false;
    session.revokedAt = cloneDate(revokedAt);
    return true;
  }

  async revokeSessionFamily(tokenFamilyId: string, revokedAt: Date): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.tokenFamilyId === tokenFamilyId && !session.revokedAt) {
        session.revokedAt = cloneDate(revokedAt);
      }
    }
  }

  async revokeAllSessions(userId: string, revokedAt: Date): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.revokedAt) {
        session.revokedAt = cloneDate(revokedAt);
      }
    }
  }

  async createOtpChallenge(input: CreateOtpChallengeInput): Promise<OtpChallengeRecord> {
    const now = new Date();
    for (const challenge of this.otpChallenges.values()) {
      if (
        challenge.email === input.email &&
        challenge.purpose === input.purpose &&
        !challenge.consumedAt
      ) {
        challenge.consumedAt = now;
      }
    }
    const challenge: OtpChallengeRecord = {
      id: randomUUID(),
      userId: input.userId ?? null,
      email: input.email,
      purpose: input.purpose,
      codeHash: input.codeHash,
      attempts: 0,
      expiresAt: cloneDate(input.expiresAt),
      consumedAt: null,
      createdAt: now,
    };
    this.otpChallenges.set(challenge.id, challenge);
    return { ...challenge };
  }

  async findLatestOtpChallenge(
    email: string,
    purpose: OtpPurpose,
  ): Promise<OtpChallengeRecord | null> {
    const challenge = [...this.otpChallenges.values()]
      .filter(
        (candidate) =>
          candidate.email === email && candidate.purpose === purpose && !candidate.consumedAt,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    return challenge ? { ...challenge } : null;
  }

  async applyOtpAttempt(
    challengeId: string,
    valid: boolean,
    maxAttempts: number,
    attemptedAt: Date,
  ): Promise<boolean> {
    const challenge = this.otpChallenges.get(challengeId);
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= attemptedAt ||
      challenge.attempts >= maxAttempts
    ) {
      return false;
    }
    if (valid) {
      challenge.consumedAt = cloneDate(attemptedAt);
      return true;
    }
    challenge.attempts += 1;
    if (challenge.attempts >= maxAttempts) {
      challenge.consumedAt = cloneDate(attemptedAt);
    }
    return false;
  }

  async createDefaultPreferences(
    userId: string,
    locale: "en" | "ur",
  ): Promise<UserPreferenceRecord> {
    const existing = this.preferences.get(userId);
    if (existing) return { ...existing };
    const now = new Date();
    const preference: UserPreferenceRecord = {
      userId,
      interfaceLocale: locale,
      translationEditionId: locale === "ur" ? "ur.jalandhry" : "en.sahih",
      recitationEditionId: "ar.alafasy",
      quranScript: "uthmani",
      theme: "LIGHT",
      arabicScale: 1,
      dailyGoalMinutes: 10,
      learningGoal: null,
      remindersEnabled: false,
      onboardingCompletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.preferences.set(userId, preference);
    return { ...preference };
  }

  async findPreferences(userId: string): Promise<UserPreferenceRecord | null> {
    const preference = this.preferences.get(userId);
    return preference ? { ...preference } : null;
  }

  async updatePreferences(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferenceRecord> {
    const existing = this.preferences.get(userId);
    if (!existing) throw new Error("User preferences not found");
    const updated: UserPreferenceRecord = {
      ...existing,
      ...input,
      updatedAt: new Date(),
    };
    this.preferences.set(userId, updated);
    return { ...updated };
  }

  async saveReadingPosition(
    input: Omit<ReadingPositionRecord, "id" | "updatedAt">,
  ): Promise<ReadingPositionRecord> {
    const key = `${input.userId}:${input.surahNumber}`;
    const existing = this.readingPositions.get(key);
    const value: ReadingPositionRecord = {
      id: existing?.id ?? randomUUID(),
      ...input,
      updatedAt: new Date(),
    };
    this.readingPositions.set(key, value);
    return { ...value };
  }

  async findLatestReadingPosition(userId: string): Promise<ReadingPositionRecord | null> {
    const position = [...this.readingPositions.values()]
      .filter((candidate) => candidate.userId === userId)
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0];
    return position ? { ...position, updatedAt: cloneDate(position.updatedAt) } : null;
  }

  async addBookmark(input: Omit<BookmarkRecord, "id" | "createdAt">): Promise<BookmarkRecord> {
    const key = `${input.userId}:${input.surahNumber}:${input.ayahNumber}`;
    if (this.bookmarks.has(key)) throw new RepositoryConflictError("Bookmark already exists");
    const value: BookmarkRecord = { id: randomUUID(), ...input, createdAt: new Date() };
    this.bookmarks.set(key, value);
    return { ...value };
  }

  async appendLearningEvent(
    input: Omit<LearningEventRecord, "id" | "recordedAt">,
  ): Promise<LearningEventRecord> {
    if (this.learningEvents.has(input.idempotencyKey)) {
      throw new RepositoryConflictError("Learning event already recorded");
    }
    const event: LearningEventRecord = {
      id: randomUUID(),
      ...input,
      payload: Object.freeze({ ...input.payload }),
      recordedAt: new Date(),
    };
    this.learningEvents.set(event.idempotencyKey, event);
    return { ...event };
  }

  async createContentRelease(
    input: Omit<ContentReleaseRecord, "createdAt">,
  ): Promise<ContentReleaseRecord> {
    if (
      this.contentReleases.has(input.id) ||
      [...this.contentReleases.values()].some(
        (release) => release.sourceId === input.sourceId && release.sha256 === input.sha256,
      )
    ) {
      throw new RepositoryConflictError("Content release already exists");
    }
    const release: ContentReleaseRecord = Object.freeze({
      ...input,
      manifest: Object.freeze({ ...input.manifest }),
      createdAt: new Date(),
    });
    this.contentReleases.set(release.id, release);
    return { ...release };
  }

  async findContentRelease(id: string): Promise<ContentReleaseRecord | null> {
    const release = this.contentReleases.get(id);
    return release ? { ...release } : null;
  }

  async createKhatmRoom(input: CreateKhatmRoomRecordInput): Promise<KhatmRoomDetailRecord> {
    if (!this.users.has(input.ownerUserId)) throw new Error("Owner user not found");
    const joinCode = input.joinCode ?? input.inviteCode.slice(0, 8).toUpperCase();
    if (
      [...this.khatmRooms.values()].some(
        (room) => room.inviteCode === input.inviteCode || room.joinCode === joinCode,
      )
    ) {
      throw new RepositoryConflictError("Invitation code already exists");
    }

    const now = new Date();
    const roomId = randomUUID();
    const campaignId = randomUUID();
    this.khatmRooms.set(roomId, {
      id: roomId,
      name: input.name,
      intention: input.intention ?? null,
      targetKhatms: input.targetKhatms,
      startDate: input.startDate ? cloneDate(input.startDate) : null,
      deadline: input.deadline ? cloneDate(input.deadline) : null,
      inviteCode: input.inviteCode,
      joinCode,
      recurrence: input.recurrence ?? "NONE",
      autoRestartOnComplete: input.autoRestartOnComplete ?? false,
      maxActiveParasPerMember: input.maxActiveParasPerMember ?? 4,
      reminderCadence: input.reminderCadence ?? "NONE",
      ownerUserId: input.ownerUserId,
      createdAt: now,
      updatedAt: now,
    });
    this.khatmMembers.set(`${roomId}:${input.ownerUserId}`, {
      roomId,
      userId: input.ownerUserId,
      role: "OWNER",
      joinedAt: now,
    });
    this.khatmCampaigns.set(campaignId, {
      id: campaignId,
      roomId,
      number: 1,
      status: "ACTIVE",
      targetKhatms: input.targetKhatms,
      startDate: input.startDate ? cloneDate(input.startDate) : null,
      deadline: input.deadline ? cloneDate(input.deadline) : null,
      createdAt: now,
      endedAt: null,
    });
    for (let khatmNumber = 1; khatmNumber <= input.targetKhatms; khatmNumber += 1) {
      for (let juzNumber = 1; juzNumber <= 30; juzNumber += 1) {
        const slot: KhatmParaSlotRecord = {
          id: randomUUID(),
          campaignId,
          khatmNumber,
          juzNumber,
          status: "AVAILABLE",
          claimedByUserId: null,
          claimedAt: null,
          readingStartedAt: null,
          completedAt: null,
          assignedByUserId: null,
        };
        this.khatmSlots.set(slot.id, slot);
      }
    }

    this.recordKhatmActivity({
      roomId,
      type: "ROOM_CREATED",
      actorUserId: input.ownerUserId,
      campaignId,
      occurredAt: now,
    });
    this.recordKhatmActivity({
      roomId,
      type: "CAMPAIGN_STARTED",
      actorUserId: input.ownerUserId,
      campaignId,
      occurredAt: now,
    });

    const created = this.khatmRoomDetail(roomId, input.ownerUserId);
    if (!created) throw new Error("Created Khatm room could not be loaded");
    return created;
  }

  async listKhatmRooms(userId: string): Promise<KhatmRoomSummaryRecord[]> {
    const roomIds = [...this.khatmMembers.values()]
      .filter((member) => member.userId === userId)
      .map((member) => member.roomId);
    return roomIds
      .map((roomId) => this.khatmRoomSummary(roomId, userId))
      .filter((room): room is KhatmRoomSummaryRecord => Boolean(room))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async findKhatmRoomForMember(
    roomId: string,
    userId: string,
  ): Promise<KhatmRoomDetailRecord | null> {
    return this.khatmRoomDetail(roomId, userId);
  }

  async findKhatmInvitePreview(credential: string): Promise<KhatmInvitePreviewRecord | null> {
    const room = this.findRoomByCredential(credential);
    if (!room) return null;
    const slots = this.slotsForCampaign(this.activeCampaignForRoom(room.id).id);
    return {
      name: room.name,
      intention: room.intention,
      deadline: room.deadline ? cloneDate(room.deadline) : null,
      recurrence: room.recurrence,
      memberCount: [...this.khatmMembers.values()].filter((member) => member.roomId === room.id)
        .length,
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
    const room = this.findRoomByCredential(credential);
    if (!room) throw new KhatmRepositoryError("ROOM_NOT_FOUND", "Khatm room not found");
    if (!this.users.has(userId)) throw new Error("Joining user not found");
    const memberKey = `${room.id}:${userId}`;
    const isNewMember = !this.khatmMembers.has(memberKey);
    if (isNewMember) {
      this.khatmMembers.set(memberKey, {
        roomId: room.id,
        userId,
        role: "MEMBER",
        joinedAt: new Date(),
      });
      this.recordKhatmActivity({
        roomId: room.id,
        type: "MEMBER_JOINED",
        actorUserId: userId,
        targetUserId: userId,
      });
    }
    const joined = this.khatmRoomDetail(room.id, userId);
    if (!joined) throw new Error("Joined Khatm room could not be loaded");
    return joined;
  }

  async updateKhatmRoom(input: UpdateKhatmRoomRecordInput): Promise<KhatmRoomDetailRecord> {
    const room = this.requireOwner(input.roomId, input.actorUserId);
    if (input.maxActiveParasPerMember !== undefined) {
      const active = this.activeCampaignForRoom(room.id);
      const highestActiveCount = [...this.khatmMembers.values()]
        .filter((member) => member.roomId === room.id)
        .reduce(
          (highest, member) => Math.max(highest, this.activeParaCount(active.id, member.userId)),
          0,
        );
      if (input.maxActiveParasPerMember < highestActiveCount) {
        throw new KhatmRepositoryError(
          "ACTIVE_PARA_LIMIT",
          "Release assignments before lowering the active Para limit",
        );
      }
    }
    if (input.name !== undefined) room.name = input.name;
    if (input.intention !== undefined) room.intention = input.intention;
    if (input.targetKhatms !== undefined) room.targetKhatms = input.targetKhatms;
    if (input.startDate !== undefined) {
      room.startDate = input.startDate && cloneDate(input.startDate);
    }
    if (input.deadline !== undefined) room.deadline = input.deadline && cloneDate(input.deadline);
    if (input.recurrence !== undefined) room.recurrence = input.recurrence;
    if (input.autoRestartOnComplete !== undefined) {
      room.autoRestartOnComplete = input.autoRestartOnComplete;
    }
    if (input.maxActiveParasPerMember !== undefined) {
      room.maxActiveParasPerMember = input.maxActiveParasPerMember;
    }
    if (input.reminderCadence !== undefined) room.reminderCadence = input.reminderCadence;
    room.updatedAt = new Date();
    this.recordKhatmActivity({
      roomId: room.id,
      type: "ROOM_UPDATED",
      actorUserId: input.actorUserId,
    });
    const detail = this.khatmRoomDetail(room.id, input.actorUserId);
    if (!detail) throw new Error("Updated Khatm room could not be loaded");
    return detail;
  }

  async rotateKhatmInvitation(
    roomId: string,
    actorUserId: string,
    inviteCode: string,
    joinCode: string,
  ): Promise<KhatmRoomDetailRecord> {
    const room = this.requireOwner(roomId, actorUserId);
    if (
      [...this.khatmRooms.values()].some(
        (candidate) =>
          candidate.id !== roomId &&
          (candidate.inviteCode === inviteCode || candidate.joinCode === joinCode),
      )
    ) {
      throw new RepositoryConflictError("Invitation code already exists");
    }
    room.inviteCode = inviteCode;
    room.joinCode = joinCode;
    room.updatedAt = new Date();
    this.recordKhatmActivity({
      roomId: room.id,
      type: "INVITE_ROTATED",
      actorUserId,
    });
    const detail = this.khatmRoomDetail(room.id, actorUserId);
    if (!detail) throw new Error("Rotated Khatm room could not be loaded");
    return detail;
  }

  async removeKhatmMember(
    roomId: string,
    actorUserId: string,
    memberUserId: string,
  ): Promise<void> {
    const room = this.khatmRooms.get(roomId);
    if (!room) throw new KhatmRepositoryError("ROOM_NOT_FOUND", "Khatm room not found");
    const actor = this.khatmMembers.get(`${roomId}:${actorUserId}`);
    const member = this.khatmMembers.get(`${roomId}:${memberUserId}`);
    if (!actor) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
    if (!member) throw new KhatmRepositoryError("MEMBER_NOT_FOUND", "Room member not found");
    if (member.role === "OWNER") {
      throw new KhatmRepositoryError("OWNER_CANNOT_LEAVE", "Transfer ownership before leaving");
    }
    if (actor.role !== "OWNER" && actorUserId !== memberUserId) {
      throw new KhatmRepositoryError("NOT_OWNER", "Only the room owner can remove another member");
    }
    const activeCampaign = this.activeCampaignForRoom(roomId);
    for (const slot of this.khatmSlots.values()) {
      if (
        slot.campaignId === activeCampaign.id &&
        slot.claimedByUserId === memberUserId &&
        (slot.status === "CLAIMED" || slot.status === "READING")
      ) {
        this.releaseSlot(slot);
      }
    }
    this.khatmMembers.delete(`${roomId}:${memberUserId}`);
    room.updatedAt = new Date();
    this.recordKhatmActivity({
      roomId,
      type: "MEMBER_REMOVED",
      actorUserId,
      targetUserId: memberUserId,
    });
  }

  async listKhatmCampaigns(roomId: string, userId: string): Promise<KhatmCampaignSummaryRecord[]> {
    if (!this.khatmMembers.has(`${roomId}:${userId}`)) {
      throw new KhatmRepositoryError("NOT_MEMBER", "You are not a member of this Khatm room");
    }
    return [...this.khatmCampaigns.values()]
      .filter((campaign) => campaign.roomId === roomId)
      .sort((left, right) => right.number - left.number)
      .map((campaign) => this.khatmCampaignSummary(campaign));
  }

  async startNextKhatmCampaign(
    input: StartNextKhatmCampaignRecordInput,
  ): Promise<KhatmRoomDetailRecord> {
    const room = this.requireOwner(input.roomId, input.actorUserId);
    const active = this.activeCampaignForRoom(room.id);
    const slots = this.slotsForCampaign(active.id);
    const isComplete = slots.every((slot) => slot.status === "COMPLETED");
    if (!isComplete && !input.cancelCurrent) {
      throw new KhatmRepositoryError(
        "CAMPAIGN_NOT_READY",
        "Complete every Para or explicitly cancel this campaign",
      );
    }
    active.status = isComplete ? "COMPLETED" : "CANCELLED";
    active.endedAt = cloneDate(input.occurredAt);
    this.recordKhatmActivity({
      roomId: room.id,
      type: isComplete ? "CAMPAIGN_COMPLETED" : "CAMPAIGN_CANCELLED",
      actorUserId: input.actorUserId,
      campaignId: active.id,
      occurredAt: input.occurredAt,
    });
    const nextCampaignId = this.createNextCampaign(room.id, input.occurredAt, input.deadline);
    this.recordKhatmActivity({
      roomId: room.id,
      type: "CAMPAIGN_STARTED",
      actorUserId: input.actorUserId,
      campaignId: nextCampaignId,
      occurredAt: input.occurredAt,
    });
    const detail = this.khatmRoomDetail(room.id, input.actorUserId);
    if (!detail) throw new Error("Next Khatm campaign could not be loaded");
    return detail;
  }

  async mutateKhatmSlot(input: MutateKhatmSlotInput): Promise<KhatmParaSlotRecord> {
    if (!this.khatmMembers.has(`${input.roomId}:${input.userId}`)) {
      throw new KhatmRepositoryError("NOT_MEMBER", "You are not a member of this Khatm room");
    }
    const campaign = this.khatmCampaigns.get(input.campaignId);
    if (!campaign || campaign.roomId !== input.roomId) {
      throw new KhatmRepositoryError("CAMPAIGN_NOT_FOUND", "Khatm campaign not found");
    }
    const slot = [...this.khatmSlots.values()].find(
      (candidate) =>
        candidate.campaignId === input.campaignId &&
        candidate.khatmNumber === input.khatmNumber &&
        candidate.juzNumber === input.juzNumber,
    );
    if (!slot) throw new KhatmRepositoryError("SLOT_NOT_FOUND", "Para slot not found");

    if (input.action === "CLAIM") {
      if (slot.status !== "AVAILABLE" || slot.claimedByUserId) {
        throw new KhatmRepositoryError("SLOT_UNAVAILABLE", "This Para has already been claimed");
      }
      const room = this.khatmRooms.get(input.roomId);
      if (!room) throw new KhatmRepositoryError("ROOM_NOT_FOUND", "Khatm room not found");
      if (this.activeParaCount(input.campaignId, input.userId) >= room.maxActiveParasPerMember) {
        throw new KhatmRepositoryError(
          "ACTIVE_PARA_LIMIT",
          `You can have up to ${room.maxActiveParasPerMember} active Paras in this room`,
        );
      }
      slot.status = "CLAIMED";
      slot.claimedByUserId = input.userId;
      slot.claimedAt = cloneDate(input.occurredAt);
      slot.readingStartedAt = null;
      slot.completedAt = null;
      slot.assignedByUserId = input.userId;
      this.recordKhatmActivity({
        roomId: input.roomId,
        type: "PARA_CLAIMED",
        actorUserId: input.userId,
        targetUserId: input.userId,
        campaignId: campaign.id,
        khatmNumber: slot.khatmNumber,
        juzNumber: slot.juzNumber,
        occurredAt: input.occurredAt,
      });
      return this.cloneKhatmSlot(slot);
    }

    if (slot.claimedByUserId !== input.userId) {
      throw new KhatmRepositoryError("NOT_CLAIMANT", "This Para is assigned to another member");
    }
    if (input.action === "RELEASE") {
      if (slot.status !== "CLAIMED" && slot.status !== "READING") {
        throw new KhatmRepositoryError("INVALID_SLOT_STATE", "This Para cannot be released");
      }
      this.releaseSlot(slot);
      this.recordKhatmActivity({
        roomId: input.roomId,
        type: "PARA_RELEASED",
        actorUserId: input.userId,
        campaignId: campaign.id,
        khatmNumber: slot.khatmNumber,
        juzNumber: slot.juzNumber,
        occurredAt: input.occurredAt,
      });
    } else if (input.action === "MARK_READING") {
      if (slot.status !== "CLAIMED") {
        throw new KhatmRepositoryError("INVALID_SLOT_STATE", "This Para is not ready to start");
      }
      slot.status = "READING";
      slot.readingStartedAt = cloneDate(input.occurredAt);
      this.recordKhatmActivity({
        roomId: input.roomId,
        type: "PARA_READING",
        actorUserId: input.userId,
        campaignId: campaign.id,
        khatmNumber: slot.khatmNumber,
        juzNumber: slot.juzNumber,
        occurredAt: input.occurredAt,
      });
    } else {
      if (slot.status !== "CLAIMED" && slot.status !== "READING") {
        throw new KhatmRepositoryError("INVALID_SLOT_STATE", "This Para cannot be completed");
      }
      slot.status = "COMPLETED";
      slot.completedAt = cloneDate(input.occurredAt);
      this.recordKhatmActivity({
        roomId: input.roomId,
        type: "PARA_COMPLETED",
        actorUserId: input.userId,
        campaignId: campaign.id,
        khatmNumber: slot.khatmNumber,
        juzNumber: slot.juzNumber,
        occurredAt: input.occurredAt,
      });
      const room = this.khatmRooms.get(input.roomId);
      if (
        room &&
        room.recurrence !== "NONE" &&
        this.slotsForCampaign(input.campaignId).every(
          (candidate) => candidate.id === slot.id || candidate.status === "COMPLETED",
        )
      ) {
        campaign.status = "COMPLETED";
        campaign.endedAt = cloneDate(input.occurredAt);
        this.recordKhatmActivity({
          roomId: room.id,
          type: "CAMPAIGN_COMPLETED",
          actorUserId: input.userId,
          campaignId: campaign.id,
          occurredAt: input.occurredAt,
        });
        const nextCampaignId = this.createNextCampaign(room.id, input.occurredAt);
        this.recordKhatmActivity({
          roomId: room.id,
          type: "CAMPAIGN_STARTED",
          actorUserId: input.userId,
          campaignId: nextCampaignId,
          occurredAt: input.occurredAt,
        });
      }
    }
    return this.cloneKhatmSlot(slot);
  }

  async adminAssignKhatmSlot(input: AdminAssignKhatmSlotInput): Promise<KhatmParaSlotRecord> {
    const room = this.requireOwner(input.roomId, input.actorUserId);
    const campaign = this.khatmCampaigns.get(input.campaignId);
    if (!campaign || campaign.roomId !== room.id || campaign.status !== "ACTIVE") {
      throw new KhatmRepositoryError("CAMPAIGN_NOT_FOUND", "Khatm campaign not found");
    }
    const slot = this.findSlot(input.campaignId, input.khatmNumber, input.juzNumber);
    if (!slot) throw new KhatmRepositoryError("SLOT_NOT_FOUND", "Para slot not found");
    if (slot.status === "COMPLETED" && !input.reopenCompleted) {
      throw new KhatmRepositoryError("INVALID_SLOT_STATE", "A completed Para cannot be reassigned");
    }
    const wasCompleted = slot.status === "COMPLETED";
    if (input.userId === null) {
      this.releaseSlot(slot);
      this.recordKhatmActivity({
        roomId: room.id,
        type: wasCompleted ? "COMPLETION_REOPENED" : "PARA_RELEASED",
        actorUserId: input.actorUserId,
        campaignId: campaign.id,
        khatmNumber: slot.khatmNumber,
        juzNumber: slot.juzNumber,
        occurredAt: input.occurredAt,
      });
      return this.cloneKhatmSlot(slot);
    }
    if (!this.khatmMembers.has(`${room.id}:${input.userId}`)) {
      throw new KhatmRepositoryError("MEMBER_NOT_FOUND", "Assign Paras only to room members");
    }
    if (
      slot.claimedByUserId !== input.userId &&
      this.activeParaCount(campaign.id, input.userId) >= room.maxActiveParasPerMember
    ) {
      throw new KhatmRepositoryError(
        "ACTIVE_PARA_LIMIT",
        "This member has reached the active Para limit",
      );
    }
    slot.status = "CLAIMED";
    slot.claimedByUserId = input.userId;
    slot.claimedAt = cloneDate(input.occurredAt);
    slot.readingStartedAt = null;
    slot.completedAt = null;
    slot.assignedByUserId = input.actorUserId;
    this.recordKhatmActivity({
      roomId: room.id,
      type: wasCompleted ? "COMPLETION_REOPENED" : "PARA_REASSIGNED",
      actorUserId: input.actorUserId,
      targetUserId: input.userId,
      campaignId: campaign.id,
      khatmNumber: slot.khatmNumber,
      juzNumber: slot.juzNumber,
      occurredAt: input.occurredAt,
    });
    return this.cloneKhatmSlot(slot);
  }

  async scheduleKhatmReminder(
    input: ScheduleKhatmReminderRecordInput,
  ): Promise<KhatmReminderRecord> {
    const room = this.requireOwner(input.roomId, input.actorUserId);
    const reminder: KhatmReminderRecord = {
      id: randomUUID(),
      roomId: room.id,
      campaignId: this.activeCampaignForRoom(room.id).id,
      createdByUserId: input.actorUserId,
      scheduledFor: cloneDate(input.scheduledFor),
      message: input.message,
      status: "PENDING",
      sentAt: null,
      cancelledAt: null,
      createdAt: new Date(),
    };
    this.khatmReminders.set(reminder.id, reminder);
    this.recordKhatmActivity({
      roomId: room.id,
      type: "REMINDER_SCHEDULED",
      actorUserId: input.actorUserId,
      campaignId: reminder.campaignId,
      occurredAt: reminder.createdAt,
    });
    return this.cloneKhatmReminder(reminder);
  }

  async listKhatmReminders(roomId: string, userId: string): Promise<KhatmReminderRecord[]> {
    if (!this.khatmMembers.has(`${roomId}:${userId}`)) {
      throw new KhatmRepositoryError("NOT_MEMBER", "You are not a member of this Khatm room");
    }
    return [...this.khatmReminders.values()]
      .filter((reminder) => reminder.roomId === roomId)
      .sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime())
      .map((reminder) => this.cloneKhatmReminder(reminder));
  }

  async cancelKhatmReminder(
    roomId: string,
    reminderId: string,
    actorUserId: string,
    occurredAt: Date,
  ): Promise<KhatmReminderRecord> {
    this.requireOwner(roomId, actorUserId);
    const reminder = this.khatmReminders.get(reminderId);
    if (!reminder || reminder.roomId !== roomId) {
      throw new KhatmRepositoryError("REMINDER_NOT_FOUND", "Khatm reminder not found");
    }
    if (reminder.status !== "PENDING") {
      throw new KhatmRepositoryError(
        "REMINDER_STATE_CONFLICT",
        "Only a pending reminder can be cancelled",
      );
    }
    reminder.status = "CANCELLED";
    reminder.cancelledAt = cloneDate(occurredAt);
    this.recordKhatmActivity({
      roomId,
      type: "REMINDER_CANCELLED",
      actorUserId,
      campaignId: reminder.campaignId,
      occurredAt,
    });
    return this.cloneKhatmReminder(reminder);
  }

  async findDueKhatmReminders(now: Date): Promise<KhatmReminderRecord[]> {
    const timestamp = now.getTime();
    return [...this.khatmReminders.values()]
      .filter(
        (reminder) =>
          reminder.status === "PENDING" && reminder.scheduledFor.getTime() <= timestamp,
      )
      .sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime())
      .map((reminder) => this.cloneKhatmReminder(reminder));
  }

  async markKhatmReminderSent(reminderId: string, sentAt: Date): Promise<KhatmReminderRecord> {
    const reminder = this.khatmReminders.get(reminderId);
    if (!reminder) {
      throw new KhatmRepositoryError("REMINDER_NOT_FOUND", "Khatm reminder not found");
    }
    reminder.status = "SENT";
    reminder.sentAt = cloneDate(sentAt);
    return this.cloneKhatmReminder(reminder);
  }

  private cloneKhatmSlot(slot: KhatmParaSlotRecord): KhatmParaSlotRecord {
    return {
      ...slot,
      claimedAt: slot.claimedAt ? cloneDate(slot.claimedAt) : null,
      readingStartedAt: slot.readingStartedAt ? cloneDate(slot.readingStartedAt) : null,
      completedAt: slot.completedAt ? cloneDate(slot.completedAt) : null,
    };
  }

  private cloneKhatmReminder(reminder: KhatmReminderRecord): KhatmReminderRecord {
    return {
      ...reminder,
      scheduledFor: cloneDate(reminder.scheduledFor),
      sentAt: reminder.sentAt ? cloneDate(reminder.sentAt) : null,
      cancelledAt: reminder.cancelledAt ? cloneDate(reminder.cancelledAt) : null,
      createdAt: cloneDate(reminder.createdAt),
    };
  }

  private recordKhatmActivity(input: {
    roomId: string;
    type: KhatmActivityType;
    actorUserId?: string | null;
    targetUserId?: string | null;
    campaignId?: string | null;
    khatmNumber?: number | null;
    juzNumber?: number | null;
    occurredAt?: Date;
  }): KhatmActivityRecord {
    const activity: KhatmActivityRecord = {
      id: randomUUID(),
      roomId: input.roomId,
      type: input.type,
      actorUserId: input.actorUserId ?? null,
      actorDisplayName: input.actorUserId
        ? (this.users.get(input.actorUserId)?.displayName ?? null)
        : null,
      targetUserId: input.targetUserId ?? null,
      campaignId: input.campaignId ?? null,
      khatmNumber: input.khatmNumber ?? null,
      juzNumber: input.juzNumber ?? null,
      occurredAt: cloneDate(input.occurredAt ?? new Date()),
    };
    this.khatmActivities.set(activity.id, activity);
    return activity;
  }

  private findRoomByCredential(credential: string) {
    const normalizedJoinCode = credential.trim().toUpperCase();
    return [...this.khatmRooms.values()].find(
      (candidate) =>
        candidate.inviteCode === credential || candidate.joinCode === normalizedJoinCode,
    );
  }

  private requireOwner(roomId: string, userId: string) {
    const room = this.khatmRooms.get(roomId);
    if (!room) throw new KhatmRepositoryError("ROOM_NOT_FOUND", "Khatm room not found");
    const membership = this.khatmMembers.get(`${roomId}:${userId}`);
    if (!membership) throw new KhatmRepositoryError("NOT_MEMBER", "You are not a room member");
    if (membership.role !== "OWNER") {
      throw new KhatmRepositoryError("NOT_OWNER", "Only the room owner can make this change");
    }
    return room;
  }

  private activeCampaignForRoom(roomId: string) {
    const campaign = [...this.khatmCampaigns.values()].find(
      (candidate) => candidate.roomId === roomId && candidate.status === "ACTIVE",
    );
    if (!campaign) throw new KhatmRepositoryError("CAMPAIGN_NOT_FOUND", "No active campaign");
    return campaign;
  }

  private slotsForCampaign(campaignId: string): KhatmParaSlotRecord[] {
    return [...this.khatmSlots.values()].filter((slot) => slot.campaignId === campaignId);
  }

  private findSlot(campaignId: string, khatmNumber: number, juzNumber: number) {
    return [...this.khatmSlots.values()].find(
      (candidate) =>
        candidate.campaignId === campaignId &&
        candidate.khatmNumber === khatmNumber &&
        candidate.juzNumber === juzNumber,
    );
  }

  private activeParaCount(campaignId: string, userId: string): number {
    return this.slotsForCampaign(campaignId).filter(
      (slot) =>
        slot.claimedByUserId === userId && (slot.status === "CLAIMED" || slot.status === "READING"),
    ).length;
  }

  private releaseSlot(slot: KhatmParaSlotRecord): void {
    slot.status = "AVAILABLE";
    slot.claimedByUserId = null;
    slot.claimedAt = null;
    slot.readingStartedAt = null;
    slot.completedAt = null;
    slot.assignedByUserId = null;
  }

  private nextRecurringDeadline(
    recurrence: KhatmRecurrence,
    previousDeadline: Date | null,
    occurredAt: Date,
  ): Date | null {
    if (recurrence === "NONE") return null;
    const deadline = cloneDate(previousDeadline ?? occurredAt);
    if (recurrence === "THREE_DAYS") deadline.setUTCDate(deadline.getUTCDate() + 3);
    else if (recurrence === "WEEKLY") deadline.setUTCDate(deadline.getUTCDate() + 7);
    else if (recurrence === "BIWEEKLY") deadline.setUTCDate(deadline.getUTCDate() + 14);
    else deadline.setUTCMonth(deadline.getUTCMonth() + 1);
    return deadline;
  }

  private createNextCampaign(roomId: string, occurredAt: Date, deadline?: Date | null): string {
    const room = this.khatmRooms.get(roomId);
    if (!room) throw new KhatmRepositoryError("ROOM_NOT_FOUND", "Khatm room not found");
    const previous = [...this.khatmCampaigns.values()]
      .filter((campaign) => campaign.roomId === roomId)
      .sort((left, right) => right.number - left.number)[0];
    const nextDeadline =
      deadline !== undefined
        ? deadline && cloneDate(deadline)
        : this.nextRecurringDeadline(
            room.recurrence,
            previous?.deadline ?? room.deadline,
            occurredAt,
          );
    const campaignId = randomUUID();
    this.khatmCampaigns.set(campaignId, {
      id: campaignId,
      roomId,
      number: (previous?.number ?? 0) + 1,
      status: "ACTIVE",
      targetKhatms: room.targetKhatms,
      startDate: cloneDate(occurredAt),
      deadline: nextDeadline,
      createdAt: cloneDate(occurredAt),
      endedAt: null,
    });
    for (let khatmNumber = 1; khatmNumber <= room.targetKhatms; khatmNumber += 1) {
      for (let juzNumber = 1; juzNumber <= 30; juzNumber += 1) {
        const slot: KhatmParaSlotRecord = {
          id: randomUUID(),
          campaignId,
          khatmNumber,
          juzNumber,
          status: "AVAILABLE",
          claimedByUserId: null,
          claimedAt: null,
          readingStartedAt: null,
          completedAt: null,
          assignedByUserId: null,
        };
        this.khatmSlots.set(slot.id, slot);
      }
    }
    room.deadline = nextDeadline;
    room.updatedAt = cloneDate(occurredAt);
    return campaignId;
  }

  private khatmCampaignSummary(
    campaign: Omit<KhatmCampaignRecord, "slots">,
  ): KhatmCampaignSummaryRecord {
    const slots = this.slotsForCampaign(campaign.id);
    return {
      ...campaign,
      deadline: campaign.deadline ? cloneDate(campaign.deadline) : null,
      createdAt: cloneDate(campaign.createdAt),
      endedAt: campaign.endedAt ? cloneDate(campaign.endedAt) : null,
      completedSlots: slots.filter((slot) => slot.status === "COMPLETED").length,
      totalSlots: slots.length,
    };
  }

  private khatmRoomDetail(roomId: string, userId: string): KhatmRoomDetailRecord | null {
    const room = this.khatmRooms.get(roomId);
    const viewer = this.khatmMembers.get(`${roomId}:${userId}`);
    if (!room || !viewer) return null;
    const campaign = [...this.khatmCampaigns.values()].find(
      (candidate) => candidate.roomId === roomId && candidate.status === "ACTIVE",
    );
    if (!campaign) throw new Error("Khatm room has no active campaign");
    const members: KhatmMemberRecord[] = [...this.khatmMembers.values()]
      .filter((member) => member.roomId === roomId)
      .map((member) => ({
        userId: member.userId,
        displayName: this.users.get(member.userId)?.displayName ?? null,
        role: member.role,
        joinedAt: cloneDate(member.joinedAt),
        activeParaCount: this.activeParaCount(campaign.id, member.userId),
      }))
      .sort((left, right) => left.joinedAt.getTime() - right.joinedAt.getTime());
    const slots = [...this.khatmSlots.values()]
      .filter((slot) => slot.campaignId === campaign.id)
      .sort(
        (left, right) => left.khatmNumber - right.khatmNumber || left.juzNumber - right.juzNumber,
      )
      .map((slot) => this.cloneKhatmSlot(slot));
    return {
      ...room,
      deadline: room.deadline ? cloneDate(room.deadline) : null,
      viewerRole: viewer.role,
      members,
      activeCampaign: {
        ...campaign,
        deadline: campaign.deadline ? cloneDate(campaign.deadline) : null,
        createdAt: cloneDate(campaign.createdAt),
        endedAt: campaign.endedAt ? cloneDate(campaign.endedAt) : null,
        slots,
      },
      recentCampaigns: [...this.khatmCampaigns.values()]
        .filter((candidate) => candidate.roomId === roomId)
        .sort((left, right) => right.number - left.number)
        .slice(0, 12)
        .map((candidate) => this.khatmCampaignSummary(candidate)),
      recentActivity: [...this.khatmActivities.values()]
        .filter((activity) => activity.roomId === roomId)
        .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
        .slice(0, 50)
        .map((activity) => ({ ...activity, occurredAt: cloneDate(activity.occurredAt) })),
      createdAt: cloneDate(room.createdAt),
      updatedAt: cloneDate(room.updatedAt),
    };
  }

  private khatmRoomSummary(roomId: string, userId: string): KhatmRoomSummaryRecord | null {
    const detail = this.khatmRoomDetail(roomId, userId);
    if (!detail) return null;
    return {
      id: detail.id,
      name: detail.name,
      intention: detail.intention,
      targetKhatms: detail.targetKhatms,
      startDate: detail.startDate ?? null,
      deadline: detail.deadline,
      ownerUserId: detail.ownerUserId,
      viewerRole: detail.viewerRole,
      memberCount: detail.members.length,
      activeCampaignId: detail.activeCampaign.id,
      completedSlots: detail.activeCampaign.slots.filter((slot) => slot.status === "COMPLETED")
        .length,
      totalSlots: detail.activeCampaign.slots.length,
      recurrence: detail.recurrence,
      maxActiveParasPerMember: detail.maxActiveParasPerMember,
      createdAt: detail.createdAt,
    };
  }
}
