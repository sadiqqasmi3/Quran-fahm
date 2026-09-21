export type UserRole = "LEARNER" | "REVIEWER" | "ADMIN";
export type UserLocale = "en" | "ur";
export type OtpPurpose = "VERIFY_EMAIL" | "PASSWORD_RESET" | "SIGN_IN";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  displayName: string | null;
  locale: UserLocale;
  role: UserRole;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName?: string;
  locale: UserLocale;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  previousRefreshTokenHash: string | null;
  rotatedAt: Date | null;
  deviceName: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CreateSessionInput {
  userId: string;
  tokenFamilyId: string;
  refreshTokenHash: string;
  deviceName: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}

export interface SessionWithUser {
  session: SessionRecord;
  user: UserRecord;
  matched: "current" | "rotated";
}

export interface OtpChallengeRecord {
  id: string;
  userId: string | null;
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface CreateOtpChallengeInput {
  userId?: string;
  email: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
}

export interface UserPreferenceRecord {
  userId: string;
  interfaceLocale: UserLocale;
  translationEditionId: string;
  recitationEditionId: string;
  quranScript: string;
  theme: "SYSTEM" | "LIGHT" | "DARK";
  arabicScale: number;
  dailyGoalMinutes: number;
  learningGoal: string | null;
  remindersEnabled: boolean;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserPreferencesInput {
  interfaceLocale: UserLocale;
  translationEditionId: string;
  recitationEditionId: string;
  theme: "SYSTEM" | "LIGHT" | "DARK";
  arabicScale: number;
  dailyGoalMinutes: number;
}

export interface ReadingPositionRecord {
  id: string;
  userId: string;
  surahNumber: number;
  ayahNumber: number;
  mode: string;
  updatedAt: Date;
}

export interface BookmarkRecord {
  id: string;
  userId: string;
  surahNumber: number;
  ayahNumber: number;
  note: string | null;
  createdAt: Date;
}

export interface LearningEventRecord {
  id: string;
  idempotencyKey: string;
  userId: string;
  eventType: string;
  learningItemId: string;
  masteryDimension: string | null;
  rating: string | null;
  payload: Readonly<Record<string, unknown>>;
  occurredAt: Date;
  recordedAt: Date;
  contentReleaseId: string;
}

export interface ContentReleaseRecord {
  id: string;
  sourceId: string;
  provider: string;
  edition: string;
  upstreamVersion: string;
  upstreamCommit: string | null;
  sha256: string;
  license: string;
  retrievedAt: Date;
  manifest: Readonly<Record<string, unknown>>;
  status: "IMPORTED" | "REVIEWED" | "ACTIVE" | "RETIRED";
  createdAt: Date;
}

export type KhatmRoomMemberRole = "OWNER" | "MEMBER";
export type KhatmCampaignStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type KhatmParaStatus = "AVAILABLE" | "CLAIMED" | "READING" | "COMPLETED";
export type KhatmSlotAction = "CLAIM" | "RELEASE" | "MARK_READING" | "COMPLETE";
export type KhatmRecurrence = "NONE" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "THREE_DAYS";
export type KhatmReminderCadence = "NONE" | "DAILY" | "DEADLINE_3_DAYS" | "DEADLINE_1_DAY";
export type KhatmReminderStatus = "PENDING" | "SENT" | "CANCELLED" | "FAILED";
export type KhatmActivityType =
  | "ROOM_CREATED"
  | "ROOM_UPDATED"
  | "MEMBER_JOINED"
  | "MEMBER_REMOVED"
  | "INVITE_ROTATED"
  | "PARA_CLAIMED"
  | "PARA_READING"
  | "PARA_COMPLETED"
  | "PARA_RELEASED"
  | "PARA_REASSIGNED"
  | "COMPLETION_REOPENED"
  | "CAMPAIGN_STARTED"
  | "CAMPAIGN_COMPLETED"
  | "CAMPAIGN_CANCELLED"
  | "REMINDER_SCHEDULED"
  | "REMINDER_CANCELLED";

export interface KhatmActivityRecord {
  id: string;
  roomId: string;
  type: KhatmActivityType;
  actorUserId: string | null;
  actorDisplayName: string | null;
  targetUserId: string | null;
  campaignId: string | null;
  khatmNumber: number | null;
  juzNumber: number | null;
  occurredAt: Date;
}

export interface KhatmMemberRecord {
  userId: string;
  displayName: string | null;
  role: KhatmRoomMemberRole;
  joinedAt: Date;
  activeParaCount: number;
}

export interface KhatmParaSlotRecord {
  id: string;
  campaignId: string;
  khatmNumber: number;
  juzNumber: number;
  status: KhatmParaStatus;
  claimedByUserId: string | null;
  claimedAt: Date | null;
  readingStartedAt: Date | null;
  completedAt: Date | null;
  assignedByUserId: string | null;
}

export interface KhatmCampaignRecord {
  id: string;
  roomId: string;
  number: number;
  status: KhatmCampaignStatus;
  targetKhatms: number;
  startDate?: Date | null;
  deadline: Date | null;
  createdAt: Date;
  endedAt: Date | null;
  slots: KhatmParaSlotRecord[];
}

export interface KhatmCampaignSummaryRecord {
  id: string;
  roomId: string;
  number: number;
  status: KhatmCampaignStatus;
  targetKhatms: number;
  startDate?: Date | null;
  deadline: Date | null;
  createdAt: Date;
  endedAt: Date | null;
  completedSlots: number;
  totalSlots: number;
}

export interface KhatmRoomDetailRecord {
  id: string;
  name: string;
  intention: string | null;
  targetKhatms: number;
  startDate?: Date | null;
  deadline: Date | null;
  inviteCode: string;
  joinCode: string;
  recurrence: KhatmRecurrence;
  autoRestartOnComplete?: boolean;
  maxActiveParasPerMember: number;
  reminderCadence: KhatmReminderCadence;
  ownerUserId: string;
  viewerRole: KhatmRoomMemberRole;
  members: KhatmMemberRecord[];
  activeCampaign: KhatmCampaignRecord;
  recentCampaigns: KhatmCampaignSummaryRecord[];
  recentActivity: KhatmActivityRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KhatmRoomSummaryRecord {
  id: string;
  name: string;
  intention: string | null;
  targetKhatms: number;
  startDate?: Date | null;
  deadline: Date | null;
  ownerUserId: string;
  viewerRole: KhatmRoomMemberRole;
  memberCount: number;
  activeCampaignId: string;
  completedSlots: number;
  totalSlots: number;
  recurrence: KhatmRecurrence;
  autoRestartOnComplete?: boolean;
  maxActiveParasPerMember: number;
  createdAt: Date;
}

export interface CreateKhatmRoomRecordInput {
  ownerUserId: string;
  name: string;
  intention?: string;
  targetKhatms: number;
  startDate?: Date;
  deadline?: Date;
  inviteCode: string;
  joinCode?: string;
  recurrence?: KhatmRecurrence;
  autoRestartOnComplete?: boolean;
  maxActiveParasPerMember?: number;
  reminderCadence?: KhatmReminderCadence;
}

export interface UpdateKhatmRoomRecordInput {
  actorUserId: string;
  roomId: string;
  name?: string;
  intention?: string | null;
  targetKhatms?: number;
  startDate?: Date | null;
  deadline?: Date | null;
  recurrence?: KhatmRecurrence;
  autoRestartOnComplete?: boolean;
  maxActiveParasPerMember?: number;
  reminderCadence?: KhatmReminderCadence;
}

export interface KhatmInvitePreviewRecord {
  name: string;
  intention: string | null;
  deadline: Date | null;
  recurrence: KhatmRecurrence;
  memberCount: number;
  targetKhatms: number;
  completedSlots: number;
  totalSlots: number;
  joinCode: string;
}

export interface MutateKhatmSlotInput {
  userId: string;
  roomId: string;
  campaignId: string;
  khatmNumber: number;
  juzNumber: number;
  action: KhatmSlotAction;
  occurredAt: Date;
}

export interface AdminAssignKhatmSlotInput {
  actorUserId: string;
  roomId: string;
  campaignId: string;
  khatmNumber: number;
  juzNumber: number;
  userId: string | null;
  reopenCompleted: boolean;
  occurredAt: Date;
}

export interface StartNextKhatmCampaignRecordInput {
  actorUserId: string;
  roomId: string;
  cancelCurrent: boolean;
  deadline?: Date | null;
  occurredAt: Date;
}

export interface ScheduleKhatmReminderRecordInput {
  actorUserId: string;
  roomId: string;
  scheduledFor: Date;
  message: string;
}

export interface KhatmReminderRecord {
  id: string;
  roomId: string;
  campaignId: string | null;
  createdByUserId: string;
  scheduledFor: Date;
  message: string;
  status: KhatmReminderStatus;
  sentAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

export type KhatmRepositoryErrorCode =
  | "ROOM_NOT_FOUND"
  | "NOT_MEMBER"
  | "NOT_OWNER"
  | "MEMBER_NOT_FOUND"
  | "OWNER_CANNOT_LEAVE"
  | "CAMPAIGN_NOT_FOUND"
  | "CAMPAIGN_NOT_READY"
  | "SLOT_NOT_FOUND"
  | "SLOT_UNAVAILABLE"
  | "NOT_CLAIMANT"
  | "INVALID_SLOT_STATE"
  | "ACTIVE_PARA_LIMIT"
  | "REMINDER_NOT_FOUND"
  | "REMINDER_STATE_CONFLICT";

export class KhatmRepositoryError extends Error {
  constructor(
    readonly code: KhatmRepositoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "KhatmRepositoryError";
  }
}

export class RepositoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryConflictError";
  }
}
