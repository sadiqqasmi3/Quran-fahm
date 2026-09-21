import { z } from "zod";

export const LocaleSchema = z.enum(["en", "ur"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const SUPPORTED_TRANSLATION_EDITIONS = [
  "ur.jalandhry",
  "ur.junagarhi",
  "ur.maududi",
  "en.sahih",
  "en.pickthall",
  "en.yusufali",
  "en.asad",
] as const;
export const TranslationEditionIdSchema = z.enum(SUPPORTED_TRANSLATION_EDITIONS);
export type TranslationEditionId = z.infer<typeof TranslationEditionIdSchema>;

export const SUPPORTED_RECITATION_EDITIONS = [
  "ar.alafasy",
  "ar.abdurrahmaansudais",
  "ar.hudhaify",
  "ar.mahermuaiqly",
] as const;
export const RecitationEditionIdSchema = z.enum(SUPPORTED_RECITATION_EDITIONS);
export type RecitationEditionId = z.infer<typeof RecitationEditionIdSchema>;

/** Hafs/Uthmani verse coordinates used by the configured runtime provider. */
export const SURAH_AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
  78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37,
  35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52,
  44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8,
  8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
] as const;

export const EmailSchema = z.string().trim().toLowerCase().email().max(254);
export const PasswordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

export const RegisterInputSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  displayName: z.string().trim().min(1).max(80).optional(),
  locale: LocaleSchema.default("ur"),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128),
  deviceName: z.string().trim().min(1).max(120).optional(),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const VerifyEmailInputSchema = z.object({
  email: EmailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;

export const ForgotPasswordInputSchema = z.object({ email: EmailSchema });
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  email: EmailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
  password: PasswordSchema,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: EmailSchema,
  displayName: z.string().nullable(),
  locale: LocaleSchema,
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const AuthSessionSchema = z.object({
  id: z.string().uuid(),
  deviceName: z.string(),
  createdAt: z.string().datetime(),
  lastUsedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  current: z.boolean(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const AuthResultSchema = z.object({
  user: UserSchema,
  accessToken: z.string().optional(),
  accessExpiresAt: z.string().datetime(),
  verificationRequired: z.boolean().default(false),
  developmentVerificationCode: z.string().optional(),
});
export type AuthResult = z.infer<typeof AuthResultSchema>;

export const MessageResponseSchema = z.object({ message: z.string() });
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const SourceAttributionSchema = z.object({
  sourceId: z.string().min(1),
  provider: z.string().min(1),
  edition: z.string().min(1),
  upstreamVersion: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  license: z.string().min(1),
});
export type SourceAttribution = z.infer<typeof SourceAttributionSchema>;

export const SurahSummarySchema = z.object({
  number: z.number().int().min(1).max(114),
  nameArabic: z.string().min(1),
  nameEnglish: z.string().min(1),
  nameTranslation: z.string().min(1),
  revelationType: z.enum(["Meccan", "Medinan"]),
  ayahCount: z.number().int().positive(),
});
export type SurahSummary = z.infer<typeof SurahSummarySchema>;

export const AyahSchema = z.object({
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().positive(),
  globalNumber: z.number().int().positive().optional(),
  arabic: z.string().min(1),
  translation: z.string().optional(),
  audioUrl: z.string().url().optional(),
});
export type Ayah = z.infer<typeof AyahSchema>;

export const SurahResponseSchema = z.object({
  contentReleaseId: z.string().min(1),
  surah: SurahSummarySchema,
  ayahs: z.array(AyahSchema),
  arabicSource: SourceAttributionSchema,
  translationSource: SourceAttributionSchema.optional(),
  recitationSource: SourceAttributionSchema.optional(),
  warnings: z.array(z.string()).default([]),
});
export type SurahResponse = z.infer<typeof SurahResponseSchema>;

export const MasteryDimensionSchema = z.enum(["visual", "meaning", "context", "audio"]);
export type MasteryDimension = z.infer<typeof MasteryDimensionSchema>;

export const RecallRatingSchema = z.enum(["again", "hard", "good", "easy"]);
export type RecallRating = z.infer<typeof RecallRatingSchema>;

export const ReviewEventInputSchema = z.object({
  idempotencyKey: z.string().uuid(),
  learningItemId: z.string().min(1),
  dimension: MasteryDimensionSchema,
  rating: RecallRatingSchema,
  occurredAt: z.string().datetime(),
  contentReleaseId: z.string().min(1),
});
export type ReviewEventInput = z.infer<typeof ReviewEventInputSchema>;

export const ReviewBatchInputSchema = z.object({
  events: z.array(ReviewEventInputSchema).min(1).max(100),
});
export type ReviewBatchInput = z.infer<typeof ReviewBatchInputSchema>;

export const UserSettingsSchema = z.object({
  locale: LocaleSchema,
  translationEditionId: TranslationEditionIdSchema,
  recitationEditionId: RecitationEditionIdSchema,
  dailyMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  theme: z.enum(["system", "light", "dark"]),
  arabicScale: z.number().min(0.8).max(1.6),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const ReadingPositionInputSchema = z
  .object({
    surahNumber: z.number().int().min(1).max(114),
    ayahNumber: z.number().int().positive(),
    mode: z.enum(["read", "study", "listen"]).default("read"),
  })
  .superRefine((position, context) => {
    const maximum = SURAH_AYAH_COUNTS[position.surahNumber - 1];
    if (maximum !== undefined && position.ayahNumber > maximum) {
      context.addIssue({
        code: "custom",
        path: ["ayahNumber"],
        message: `Ayah must be between 1 and ${maximum} for this surah`,
      });
    }
  });
export type ReadingPositionInput = z.infer<typeof ReadingPositionInputSchema>;

export const ReadingPositionSchema = ReadingPositionInputSchema.extend({
  updatedAt: z.string().datetime(),
});
export type ReadingPosition = z.infer<typeof ReadingPositionSchema>;

export const KhatmRoomMemberRoleSchema = z.enum(["owner", "member"]);
export type KhatmRoomMemberRole = z.infer<typeof KhatmRoomMemberRoleSchema>;

export const KhatmCampaignStatusSchema = z.enum(["active", "completed", "cancelled"]);
export type KhatmCampaignStatus = z.infer<typeof KhatmCampaignStatusSchema>;

export const KhatmParaStatusSchema = z.enum(["available", "claimed", "reading", "completed"]);
export type KhatmParaStatus = z.infer<typeof KhatmParaStatusSchema>;

export const KhatmRecurrenceSchema = z.enum([
  "none",
  "weekly",
  "biweekly",
  "monthly",
  "three_days",
]);
export type KhatmRecurrence = z.infer<typeof KhatmRecurrenceSchema>;

export const KhatmReminderCadenceSchema = z.enum([
  "none",
  "daily",
  "deadline_3_days",
  "deadline_1_day",
]);
export type KhatmReminderCadence = z.infer<typeof KhatmReminderCadenceSchema>;

export const KhatmReminderStatusSchema = z.enum(["pending", "sent", "cancelled", "failed"]);
export type KhatmReminderStatus = z.infer<typeof KhatmReminderStatusSchema>;

export const KhatmActivityTypeSchema = z.enum([
  "room_created",
  "room_updated",
  "member_joined",
  "member_removed",
  "invite_rotated",
  "para_claimed",
  "para_reading",
  "para_completed",
  "para_released",
  "para_reassigned",
  "completion_reopened",
  "campaign_started",
  "campaign_completed",
  "campaign_cancelled",
  "reminder_scheduled",
  "reminder_cancelled",
]);
export type KhatmActivityType = z.infer<typeof KhatmActivityTypeSchema>;

export const KhatmInviteCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{32,64}$/, "Invalid invitation code");

/** Human-readable code for joining without opening a shared URL.
 * Ambiguous characters (0, 1, I, O) are deliberately excluded. */
export const KhatmJoinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/, "Enter the 8-character room code");

export const KhatmJoinCredentialSchema = z.union([KhatmInviteCodeSchema, KhatmJoinCodeSchema]);

export const KHATM_JUZ_METADATA = [
  [1, "الم", "Alif Lam Mim", 1, 1, 2, 141],
  [2, "سَيَقُولُ", "Sayaqool", 2, 142, 2, 252],
  [3, "تِلْكَ الرُّسُلُ", "Tilkar Rusul", 2, 253, 3, 92],
  [4, "لَنْ تَنَالُوا", "Lan Tana Loo", 3, 93, 4, 23],
  [5, "وَالْمُحْصَنَاتُ", "Wal Mohsanat", 4, 24, 4, 147],
  [6, "لَا يُحِبُّ اللَّهُ", "La Yuhibbullah", 4, 148, 5, 81],
  [7, "وَإِذَا سَمِعُوا", "Wa Iza Samiu", 5, 82, 6, 110],
  [8, "وَلَوْ أَنَّنَا", "Wa Lau Annana", 6, 111, 7, 87],
  [9, "قَالَ الْمَلَأُ", "Qalal Malao", 7, 88, 8, 40],
  [10, "وَاعْلَمُوا", "Wa'lamu", 8, 41, 9, 92],
  [11, "يَعْتَذِرُونَ", "Ya'tadhirun", 9, 93, 11, 5],
  [12, "وَمَا مِنْ دَابَّةٍ", "Wa Mamin Daabbah", 11, 6, 12, 52],
  [13, "وَمَا أُبَرِّئُ", "Wa Ma Ubarriu", 12, 53, 14, 52],
  [14, "رُبَمَا", "Rubama", 15, 1, 16, 128],
  [15, "سُبْحَانَ الَّذِي", "Subhanalladhi", 17, 1, 18, 74],
  [16, "قَالَ أَلَمْ", "Qala Alam", 18, 75, 20, 135],
  [17, "اقْتَرَبَ", "Iqtaraba", 21, 1, 22, 78],
  [18, "قَدْ أَفْلَحَ", "Qad Aflaha", 23, 1, 25, 20],
  [19, "وَقَالَ الَّذِينَ", "Wa Qalalladhina", 25, 21, 27, 55],
  [20, "أَمَّنْ خَلَقَ", "Amman Khalaq", 27, 56, 29, 45],
  [21, "اتْلُ مَا أُوحِيَ", "Utlu Ma Oohi", 29, 46, 33, 30],
  [22, "وَمَنْ يَقْنُتْ", "Wa Manyaqnut", 33, 31, 36, 27],
  [23, "وَمَا لِيَ", "Wa Mali", 36, 28, 39, 31],
  [24, "فَمَنْ أَظْلَمُ", "Faman Azlam", 39, 32, 41, 46],
  [25, "إِلَيْهِ يُرَدُّ", "Ilayhi Yuraddu", 41, 47, 45, 37],
  [26, "حم", "Ha Meem", 46, 1, 51, 30],
  [27, "قَالَ فَمَا خَطْبُكُمْ", "Qala Fama Khatbukum", 51, 31, 57, 29],
  [28, "قَدْ سَمِعَ اللَّهُ", "Qad Sami Allah", 58, 1, 66, 12],
  [29, "تَبَارَكَ الَّذِي", "Tabarakalladhi", 67, 1, 77, 50],
  [30, "عَمَّ يَتَسَاءَلُونَ", "Amma Yatasa'alun", 78, 1, 114, 6],
] as const;

export const KhatmJuzMetadataSchema = z.object({
  number: z.number().int().min(1).max(30),
  nameArabic: z.string().min(1),
  nameTransliteration: z.string().min(1),
  startSurahNumber: z.number().int().min(1).max(114),
  startAyahNumber: z.number().int().positive(),
  endSurahNumber: z.number().int().min(1).max(114),
  endAyahNumber: z.number().int().positive(),
  readerPath: z.string().startsWith("/quran"),
});
export type KhatmJuzMetadata = z.infer<typeof KhatmJuzMetadataSchema>;

export function khatmJuzMetadata(juzNumber: number): KhatmJuzMetadata {
  const row = KHATM_JUZ_METADATA[juzNumber - 1];
  if (!row) throw new Error(`Unknown Para ${juzNumber}`);
  const [
    number,
    nameArabic,
    nameTransliteration,
    startSurahNumber,
    startAyahNumber,
    endSurahNumber,
    endAyahNumber,
  ] = row;
  return {
    number,
    nameArabic,
    nameTransliteration,
    startSurahNumber,
    startAyahNumber,
    endSurahNumber,
    endAyahNumber,
    readerPath: `/quran?surah=${startSurahNumber}&ayah=${startAyahNumber}`,
  };
}

export const CreateKhatmRoomInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  intention: z.string().trim().min(1).max(300).optional(),
  targetKhatms: z.number().int().min(1).max(10),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().optional(),
  recurrence: KhatmRecurrenceSchema.optional(),
  autoRestartOnComplete: z.boolean().optional(),
  maxActiveParasPerMember: z.number().int().min(1).max(30).optional(),
  reminderCadence: KhatmReminderCadenceSchema.optional(),
});
export type CreateKhatmRoomInput = z.infer<typeof CreateKhatmRoomInputSchema>;

export const JoinKhatmRoomInputSchema = z.object({ inviteCode: KhatmJoinCredentialSchema });
export type JoinKhatmRoomInput = z.infer<typeof JoinKhatmRoomInputSchema>;

export const UpdateKhatmRoomInputSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    intention: z.string().trim().min(1).max(300).nullable().optional(),
    targetKhatms: z.number().int().min(1).max(10).optional(),
    startDate: z.string().datetime().nullable().optional(),
    deadline: z.string().datetime().nullable().optional(),
    recurrence: KhatmRecurrenceSchema.optional(),
    autoRestartOnComplete: z.boolean().optional(),
    maxActiveParasPerMember: z.number().int().min(1).max(30).optional(),
    reminderCadence: KhatmReminderCadenceSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Provide at least one room setting");
export type UpdateKhatmRoomInput = z.infer<typeof UpdateKhatmRoomInputSchema>;

export const KhatmRoomParamsSchema = z.object({ roomId: z.string().uuid() });
export const KhatmSlotParamsSchema = KhatmRoomParamsSchema.extend({
  campaignId: z.string().uuid(),
  khatmNumber: z.coerce.number().int().min(1).max(10),
  juzNumber: z.coerce.number().int().min(1).max(30),
});
export type KhatmSlotParams = z.infer<typeof KhatmSlotParamsSchema>;

export const KhatmCampaignParamsSchema = KhatmRoomParamsSchema.extend({
  campaignId: z.string().uuid(),
});
export const KhatmMemberParamsSchema = KhatmRoomParamsSchema.extend({
  userId: z.string().uuid(),
});
export const KhatmReminderParamsSchema = KhatmRoomParamsSchema.extend({
  reminderId: z.string().uuid(),
});

export const KhatmAdminAssignmentInputSchema = z.object({
  userId: z.string().uuid().nullable(),
  reopenCompleted: z.boolean().optional(),
});
export type KhatmAdminAssignmentInput = z.infer<typeof KhatmAdminAssignmentInputSchema>;

export const StartNextKhatmCampaignInputSchema = z.object({
  cancelCurrent: z.boolean().default(false),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
});
export type StartNextKhatmCampaignInput = z.infer<typeof StartNextKhatmCampaignInputSchema>;

export const ScheduleKhatmReminderInputSchema = z.object({
  scheduledFor: z.string().datetime(),
  message: z.string().trim().min(1).max(280),
});
export type ScheduleKhatmReminderInput = z.infer<typeof ScheduleKhatmReminderInputSchema>;

export const KhatmMemberSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string().nullable(),
  role: KhatmRoomMemberRoleSchema,
  joinedAt: z.string().datetime(),
  activeParaCount: z.number().int().nonnegative().optional(),
});
export type KhatmMember = z.infer<typeof KhatmMemberSchema>;

export const KhatmParaSlotSchema = z.object({
  id: z.string().uuid(),
  khatmNumber: z.number().int().min(1).max(10),
  juzNumber: z.number().int().min(1).max(30),
  status: KhatmParaStatusSchema,
  claimedByUserId: z.string().uuid().nullable(),
  claimedAt: z.string().datetime().nullable(),
  readingStartedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  assignedByUserId: z.string().uuid().nullable().optional(),
  juz: KhatmJuzMetadataSchema.optional(),
});
export type KhatmParaSlot = z.infer<typeof KhatmParaSlotSchema>;

export const KhatmCampaignSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  status: KhatmCampaignStatusSchema,
  targetKhatms: z.number().int().min(1).max(10),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable().optional(),
  slots: z.array(KhatmParaSlotSchema),
});
export type KhatmCampaign = z.infer<typeof KhatmCampaignSchema>;

export const KhatmCampaignSummarySchema = KhatmCampaignSchema.omit({ slots: true }).extend({
  completedSlots: z.number().int().nonnegative(),
  totalSlots: z.number().int().positive(),
});
export type KhatmCampaignSummary = z.infer<typeof KhatmCampaignSummarySchema>;

export const KhatmActivitySchema = z.object({
  id: z.string().uuid(),
  type: KhatmActivityTypeSchema,
  actorUserId: z.string().uuid().nullable(),
  actorDisplayName: z.string().nullable(),
  targetUserId: z.string().uuid().nullable(),
  campaignId: z.string().uuid().nullable(),
  khatmNumber: z.number().int().min(1).max(10).nullable(),
  juzNumber: z.number().int().min(1).max(30).nullable(),
  occurredAt: z.string().datetime(),
});
export type KhatmActivity = z.infer<typeof KhatmActivitySchema>;

export const KhatmRoomSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  intention: z.string().nullable(),
  targetKhatms: z.number().int().min(1).max(10),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable(),
  ownerUserId: z.string().uuid(),
  viewerRole: KhatmRoomMemberRoleSchema,
  memberCount: z.number().int().nonnegative(),
  activeCampaignId: z.string().uuid(),
  completedSlots: z.number().int().nonnegative(),
  totalSlots: z.number().int().positive(),
  recurrence: KhatmRecurrenceSchema.optional(),
  autoRestartOnComplete: z.boolean().optional(),
  maxActiveParasPerMember: z.number().int().min(1).max(30).optional(),
  createdAt: z.string().datetime(),
});
export type KhatmRoomSummary = z.infer<typeof KhatmRoomSummarySchema>;

export const KhatmRoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  intention: z.string().nullable(),
  targetKhatms: z.number().int().min(1).max(10),
  startDate: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable(),
  /** Secure share token is returned only to the room owner. */
  inviteCode: KhatmInviteCodeSchema.nullable(),
  joinCode: KhatmJoinCodeSchema,
  recurrence: KhatmRecurrenceSchema,
  autoRestartOnComplete: z.boolean().optional(),
  maxActiveParasPerMember: z.number().int().min(1).max(30),
  reminderCadence: KhatmReminderCadenceSchema,
  ownerUserId: z.string().uuid(),
  viewerRole: KhatmRoomMemberRoleSchema,
  members: z.array(KhatmMemberSchema),
  activeCampaign: KhatmCampaignSchema,
  recentCampaigns: z.array(KhatmCampaignSummarySchema).optional(),
  recentActivity: z.array(KhatmActivitySchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type KhatmRoom = z.infer<typeof KhatmRoomSchema>;

export const KhatmRoomResponseSchema = z.object({ room: KhatmRoomSchema });
export const KhatmRoomListResponseSchema = z.object({ rooms: z.array(KhatmRoomSummarySchema) });
export const KhatmSlotResponseSchema = z.object({ slot: KhatmParaSlotSchema });

export const KhatmInvitePreviewSchema = z.object({
  name: z.string(),
  intention: z.string().nullable(),
  deadline: z.string().datetime().nullable(),
  recurrence: KhatmRecurrenceSchema,
  memberCount: z.number().int().positive(),
  targetKhatms: z.number().int().min(1).max(10),
  completedSlots: z.number().int().nonnegative(),
  totalSlots: z.number().int().positive(),
  joinCode: KhatmJoinCodeSchema,
  joinPath: z.string().startsWith("/khatm?join="),
});
export const KhatmInvitePreviewResponseSchema = z.object({ invitation: KhatmInvitePreviewSchema });
export type KhatmInvitePreview = z.infer<typeof KhatmInvitePreviewSchema>;

export const KhatmReminderSchema = z.object({
  id: z.string().uuid(),
  roomId: z.string().uuid(),
  campaignId: z.string().uuid().nullable(),
  scheduledFor: z.string().datetime(),
  message: z.string(),
  status: KhatmReminderStatusSchema,
  sentAt: z.string().datetime().nullable(),
  cancelledAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type KhatmReminder = z.infer<typeof KhatmReminderSchema>;
export const KhatmReminderResponseSchema = z.object({ reminder: KhatmReminderSchema });
export const KhatmReminderListResponseSchema = z.object({
  reminders: z.array(KhatmReminderSchema),
});

export const KhatmCampaignListResponseSchema = z.object({
  campaigns: z.array(KhatmCampaignSummarySchema),
});
