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

export interface AuthRepository {
  createUser(input: CreateUserInput): Promise<UserRecord>;
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  markEmailVerified(userId: string, verifiedAt: Date): Promise<UserRecord>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;

  createSession(input: CreateSessionInput): Promise<SessionRecord>;
  findSessionById(sessionId: string): Promise<SessionRecord | null>;
  findSessionByRefreshTokenHash(hash: string): Promise<SessionWithUser | null>;
  rotateSession(
    sessionId: string,
    expectedHash: string,
    nextHash: string,
    usedAt: Date,
    expiresAt: Date,
  ): Promise<SessionRecord | null>;
  listSessions(userId: string): Promise<SessionRecord[]>;
  revokeSession(sessionId: string, userId: string, revokedAt: Date): Promise<boolean>;
  revokeSessionFamily(tokenFamilyId: string, revokedAt: Date): Promise<void>;
  revokeAllSessions(userId: string, revokedAt: Date): Promise<void>;

  createOtpChallenge(input: CreateOtpChallengeInput): Promise<OtpChallengeRecord>;
  findLatestOtpChallenge(email: string, purpose: OtpPurpose): Promise<OtpChallengeRecord | null>;
  applyOtpAttempt(
    challengeId: string,
    valid: boolean,
    maxAttempts: number,
    attemptedAt: Date,
  ): Promise<boolean>;
}

export interface LearningRepository {
  createDefaultPreferences(userId: string, locale: "en" | "ur"): Promise<UserPreferenceRecord>;
  findPreferences(userId: string): Promise<UserPreferenceRecord | null>;
  updatePreferences(
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferenceRecord>;
  saveReadingPosition(
    input: Omit<ReadingPositionRecord, "id" | "updatedAt">,
  ): Promise<ReadingPositionRecord>;
  findLatestReadingPosition(userId: string): Promise<ReadingPositionRecord | null>;
  addBookmark(input: Omit<BookmarkRecord, "id" | "createdAt">): Promise<BookmarkRecord>;
  appendLearningEvent(
    input: Omit<LearningEventRecord, "id" | "recordedAt">,
  ): Promise<LearningEventRecord>;
  createContentRelease(
    input: Omit<ContentReleaseRecord, "createdAt">,
  ): Promise<ContentReleaseRecord>;
  findContentRelease(id: string): Promise<ContentReleaseRecord | null>;
}

export interface KhatmRepository {
  createKhatmRoom(input: CreateKhatmRoomRecordInput): Promise<KhatmRoomDetailRecord>;
  listKhatmRooms(userId: string): Promise<KhatmRoomSummaryRecord[]>;
  findKhatmRoomForMember(roomId: string, userId: string): Promise<KhatmRoomDetailRecord | null>;
  findKhatmInvitePreview(credential: string): Promise<KhatmInvitePreviewRecord | null>;
  joinKhatmRoomByInviteCode(credential: string, userId: string): Promise<KhatmRoomDetailRecord>;
  updateKhatmRoom(input: UpdateKhatmRoomRecordInput): Promise<KhatmRoomDetailRecord>;
  rotateKhatmInvitation(
    roomId: string,
    actorUserId: string,
    inviteCode: string,
    joinCode: string,
  ): Promise<KhatmRoomDetailRecord>;
  removeKhatmMember(roomId: string, actorUserId: string, memberUserId: string): Promise<void>;
  listKhatmCampaigns(roomId: string, userId: string): Promise<KhatmCampaignSummaryRecord[]>;
  startNextKhatmCampaign(input: StartNextKhatmCampaignRecordInput): Promise<KhatmRoomDetailRecord>;
  mutateKhatmSlot(input: MutateKhatmSlotInput): Promise<KhatmParaSlotRecord>;
  adminAssignKhatmSlot(input: AdminAssignKhatmSlotInput): Promise<KhatmParaSlotRecord>;
  scheduleKhatmReminder(input: ScheduleKhatmReminderRecordInput): Promise<KhatmReminderRecord>;
  listKhatmReminders(roomId: string, userId: string): Promise<KhatmReminderRecord[]>;
  cancelKhatmReminder(
    roomId: string,
    reminderId: string,
    actorUserId: string,
    occurredAt: Date,
  ): Promise<KhatmReminderRecord>;
  findDueKhatmReminders(now: Date): Promise<KhatmReminderRecord[]>;
  markKhatmReminderSent(reminderId: string, sentAt: Date): Promise<KhatmReminderRecord>;
}

export type QuranFehamRepository = AuthRepository & LearningRepository & KhatmRepository;
