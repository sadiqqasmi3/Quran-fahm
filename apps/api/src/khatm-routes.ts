import { randomBytes } from "node:crypto";
import {
  CreateKhatmRoomInputSchema,
  JoinKhatmRoomInputSchema,
  KhatmAdminAssignmentInputSchema,
  KhatmCampaignListResponseSchema,
  KhatmInvitePreviewResponseSchema,
  KhatmJoinCredentialSchema,
  KhatmMemberParamsSchema,
  KhatmReminderListResponseSchema,
  KhatmReminderParamsSchema,
  KhatmReminderResponseSchema,
  KhatmRoomListResponseSchema,
  KhatmRoomParamsSchema,
  KhatmRoomResponseSchema,
  KhatmSlotParamsSchema,
  KhatmSlotResponseSchema,
  khatmJuzMetadata,
  ScheduleKhatmReminderInputSchema,
  StartNextKhatmCampaignInputSchema,
  UpdateKhatmRoomInputSchema,
} from "@quran-feham/contracts";
import {
  type KhatmCampaignRecord,
  type KhatmCampaignSummaryRecord,
  type KhatmParaSlotRecord,
  type KhatmRecurrence,
  type KhatmReminderRecord,
  type KhatmRoomDetailRecord,
  type KhatmRoomSummaryRecord,
  type QuranFehamRepository,
  RepositoryConflictError,
} from "@quran-feham/database";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodType } from "zod";
import { ApiError } from "./errors.js";

interface RegisterKhatmRoutesOptions {
  repository: QuranFehamRepository;
  requireUserId: (request: FastifyRequest) => Promise<string>;
}

function parseWithSchema<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  throw new ApiError(
    400,
    "VALIDATION_FAILED",
    "Please correct the highlighted fields",
    fieldErrors,
  );
}

function serializeSlot(slot: KhatmParaSlotRecord) {
  return {
    id: slot.id,
    khatmNumber: slot.khatmNumber,
    juzNumber: slot.juzNumber,
    status: slot.status.toLowerCase(),
    claimedByUserId: slot.claimedByUserId,
    claimedAt: slot.claimedAt?.toISOString() ?? null,
    readingStartedAt: slot.readingStartedAt?.toISOString() ?? null,
    completedAt: slot.completedAt?.toISOString() ?? null,
    assignedByUserId: slot.assignedByUserId,
    juz: khatmJuzMetadata(slot.juzNumber),
  };
}

function serializeCampaign(campaign: KhatmCampaignRecord) {
  return {
    id: campaign.id,
    number: campaign.number,
    status: campaign.status.toLowerCase(),
    targetKhatms: campaign.targetKhatms,
    startDate: campaign.startDate?.toISOString() ?? null,
    deadline: campaign.deadline?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    endedAt: campaign.endedAt?.toISOString() ?? null,
    slots: campaign.slots.map(serializeSlot),
  };
}

function serializeCampaignSummary(campaign: KhatmCampaignSummaryRecord) {
  return {
    id: campaign.id,
    number: campaign.number,
    status: campaign.status.toLowerCase(),
    targetKhatms: campaign.targetKhatms,
    startDate: campaign.startDate?.toISOString() ?? null,
    deadline: campaign.deadline?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    endedAt: campaign.endedAt?.toISOString() ?? null,
    completedSlots: campaign.completedSlots,
    totalSlots: campaign.totalSlots,
  };
}

function serializeRoom(room: KhatmRoomDetailRecord) {
  return {
    id: room.id,
    name: room.name,
    intention: room.intention,
    targetKhatms: room.targetKhatms,
    startDate: room.startDate?.toISOString() ?? null,
    deadline: room.deadline?.toISOString() ?? null,
    inviteCode: room.viewerRole === "OWNER" ? room.inviteCode : null,
    joinCode: room.joinCode,
    recurrence: room.recurrence.toLowerCase(),
    autoRestartOnComplete: room.autoRestartOnComplete ?? false,
    maxActiveParasPerMember: room.maxActiveParasPerMember,
    reminderCadence: room.reminderCadence.toLowerCase(),
    ownerUserId: room.ownerUserId,
    viewerRole: room.viewerRole.toLowerCase(),
    members: room.members.map((member) => ({
      userId: member.userId,
      displayName: member.displayName,
      role: member.role.toLowerCase(),
      joinedAt: member.joinedAt.toISOString(),
      activeParaCount: member.activeParaCount,
    })),
    activeCampaign: serializeCampaign(room.activeCampaign),
    recentCampaigns: room.recentCampaigns.map(serializeCampaignSummary),
    recentActivity: room.recentActivity.map((activity) => ({
      id: activity.id,
      type: activity.type.toLowerCase(),
      actorUserId: activity.actorUserId,
      actorDisplayName: activity.actorDisplayName,
      targetUserId: activity.targetUserId,
      campaignId: activity.campaignId,
      khatmNumber: activity.khatmNumber,
      juzNumber: activity.juzNumber,
      occurredAt: activity.occurredAt.toISOString(),
    })),
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}

function serializeSummary(room: KhatmRoomSummaryRecord) {
  return {
    ...room,
    startDate: room.startDate?.toISOString() ?? null,
    deadline: room.deadline?.toISOString() ?? null,
    viewerRole: room.viewerRole.toLowerCase(),
    recurrence: room.recurrence.toLowerCase(),
    createdAt: room.createdAt.toISOString(),
  };
}

function serializeReminder(reminder: KhatmReminderRecord) {
  return {
    id: reminder.id,
    roomId: reminder.roomId,
    campaignId: reminder.campaignId,
    scheduledFor: reminder.scheduledFor.toISOString(),
    message: reminder.message,
    status: reminder.status.toLowerCase(),
    sentAt: reminder.sentAt?.toISOString() ?? null,
    cancelledAt: reminder.cancelledAt?.toISOString() ?? null,
    createdAt: reminder.createdAt.toISOString(),
  };
}

function inviteCode(): string {
  return randomBytes(24).toString("base64url");
}

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function joinCode(): string {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length]).join("");
}

export function registerKhatmRoutes(
  app: FastifyInstance,
  { repository, requireUserId }: RegisterKhatmRoutesOptions,
): void {
  app.post("/api/v1/khatm/rooms", async (request, reply) => {
    const userId = await requireUserId(request);
    const input = parseWithSchema(CreateKhatmRoomInputSchema, request.body);
    let room: KhatmRoomDetailRecord | undefined;
    for (let attempt = 0; attempt < 3 && !room; attempt += 1) {
      try {
        room = await repository.createKhatmRoom({
          ownerUserId: userId,
          name: input.name,
          ...(input.intention ? { intention: input.intention } : {}),
          targetKhatms: input.targetKhatms,
          ...(input.startDate ? { startDate: new Date(input.startDate) } : {}),
          ...(input.deadline ? { deadline: new Date(input.deadline) } : {}),
          inviteCode: inviteCode(),
          joinCode: joinCode(),
          recurrence: (input.recurrence ?? "none").toUpperCase() as KhatmRecurrence,
          autoRestartOnComplete: input.autoRestartOnComplete ?? false,
          maxActiveParasPerMember: input.maxActiveParasPerMember ?? 4,
          reminderCadence: (input.reminderCadence ?? "none").toUpperCase() as
            | "NONE"
            | "DAILY"
            | "DEADLINE_3_DAYS"
            | "DEADLINE_1_DAY",
        });
      } catch (error) {
        if (!(error instanceof RepositoryConflictError) || attempt === 2) throw error;
      }
    }
    if (!room) throw new ApiError(503, "ROOM_CREATE_FAILED", "Could not create the room");
    return reply.code(201).send(KhatmRoomResponseSchema.parse({ room: serializeRoom(room) }));
  });

  app.get("/api/v1/khatm/rooms", async (request) => {
    const userId = await requireUserId(request);
    const rooms = await repository.listKhatmRooms(userId);
    return KhatmRoomListResponseSchema.parse({ rooms: rooms.map(serializeSummary) });
  });

  app.get<{ Params: { credential: string } }>(
    "/api/v1/khatm/invitations/:credential",
    async (request) => {
      const credential = parseWithSchema(KhatmJoinCredentialSchema, request.params.credential);
      const invitation = await repository.findKhatmInvitePreview(credential);
      if (!invitation) {
        throw new ApiError(404, "KHATM_INVITATION_NOT_FOUND", "This invitation is no longer valid");
      }
      return KhatmInvitePreviewResponseSchema.parse({
        invitation: {
          name: invitation.name,
          intention: invitation.intention,
          deadline: invitation.deadline?.toISOString() ?? null,
          recurrence: invitation.recurrence.toLowerCase(),
          memberCount: invitation.memberCount,
          targetKhatms: invitation.targetKhatms,
          completedSlots: invitation.completedSlots,
          totalSlots: invitation.totalSlots,
          joinCode: invitation.joinCode,
          joinPath: `/khatm?join=${encodeURIComponent(credential)}`,
        },
      });
    },
  );

  app.post("/api/v1/khatm/rooms/join", async (request) => {
    const userId = await requireUserId(request);
    const input = parseWithSchema(JoinKhatmRoomInputSchema, request.body);
    const room = await repository.joinKhatmRoomByInviteCode(input.inviteCode, userId);
    return KhatmRoomResponseSchema.parse({ room: serializeRoom(room) });
  });

  app.get<{ Params: { roomId: string } }>("/api/v1/khatm/rooms/:roomId", async (request) => {
    const userId = await requireUserId(request);
    const { roomId } = parseWithSchema(KhatmRoomParamsSchema, request.params);
    const room = await repository.findKhatmRoomForMember(roomId, userId);
    if (!room) throw new ApiError(404, "KHATM_ROOM_NOT_FOUND", "Khatm room not found");
    return KhatmRoomResponseSchema.parse({ room: serializeRoom(room) });
  });

  app.patch<{ Params: { roomId: string } }>("/api/v1/khatm/rooms/:roomId", async (request) => {
    const userId = await requireUserId(request);
    const { roomId } = parseWithSchema(KhatmRoomParamsSchema, request.params);
    const input = parseWithSchema(UpdateKhatmRoomInputSchema, request.body);
    const room = await repository.updateKhatmRoom({
      actorUserId: userId,
      roomId,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.intention !== undefined ? { intention: input.intention } : {}),
      ...(input.targetKhatms !== undefined ? { targetKhatms: input.targetKhatms } : {}),
      ...(input.startDate !== undefined
        ? { startDate: input.startDate ? new Date(input.startDate) : null }
        : {}),
      ...(input.deadline !== undefined
        ? { deadline: input.deadline ? new Date(input.deadline) : null }
        : {}),
      ...(input.recurrence !== undefined
        ? { recurrence: input.recurrence.toUpperCase() as KhatmRecurrence }
        : {}),
      ...(input.autoRestartOnComplete !== undefined
        ? { autoRestartOnComplete: input.autoRestartOnComplete }
        : {}),
      ...(input.maxActiveParasPerMember !== undefined
        ? { maxActiveParasPerMember: input.maxActiveParasPerMember }
        : {}),
      ...(input.reminderCadence !== undefined
        ? {
            reminderCadence: input.reminderCadence.toUpperCase() as
              | "NONE"
              | "DAILY"
              | "DEADLINE_3_DAYS"
              | "DEADLINE_1_DAY",
          }
        : {}),
    });
    return KhatmRoomResponseSchema.parse({ room: serializeRoom(room) });
  });

  app.post<{ Params: { roomId: string } }>(
    "/api/v1/khatm/rooms/:roomId/invitation/rotate",
    async (request) => {
      const userId = await requireUserId(request);
      const { roomId } = parseWithSchema(KhatmRoomParamsSchema, request.params);
      const room = await repository.rotateKhatmInvitation(roomId, userId, inviteCode(), joinCode());
      return KhatmRoomResponseSchema.parse({ room: serializeRoom(room) });
    },
  );

  app.delete<{ Params: { roomId: string; userId: string } }>(
    "/api/v1/khatm/rooms/:roomId/members/:userId",
    async (request, reply) => {
      const actorUserId = await requireUserId(request);
      const params = parseWithSchema(KhatmMemberParamsSchema, request.params);
      await repository.removeKhatmMember(params.roomId, actorUserId, params.userId);
      return reply.code(204).send();
    },
  );

  app.get<{ Params: { roomId: string } }>(
    "/api/v1/khatm/rooms/:roomId/campaigns",
    async (request) => {
      const userId = await requireUserId(request);
      const { roomId } = parseWithSchema(KhatmRoomParamsSchema, request.params);
      const campaigns = await repository.listKhatmCampaigns(roomId, userId);
      return KhatmCampaignListResponseSchema.parse({
        campaigns: campaigns.map(serializeCampaignSummary),
      });
    },
  );

  app.post<{ Params: { roomId: string } }>(
    "/api/v1/khatm/rooms/:roomId/campaigns/next",
    async (request) => {
      const userId = await requireUserId(request);
      const { roomId } = parseWithSchema(KhatmRoomParamsSchema, request.params);
      const input = parseWithSchema(StartNextKhatmCampaignInputSchema, request.body ?? {});
      const room = await repository.startNextKhatmCampaign({
        actorUserId: userId,
        roomId,
        cancelCurrent: input.cancelCurrent,
        ...(input.startDate !== undefined
          ? { startDate: input.startDate ? new Date(input.startDate) : null }
          : {}),
        ...(input.deadline !== undefined
          ? { deadline: input.deadline ? new Date(input.deadline) : null }
          : {}),
        occurredAt: new Date(),
      });
      return KhatmRoomResponseSchema.parse({ room: serializeRoom(room) });
    },
  );

  const mutate =
    (action: "CLAIM" | "RELEASE" | "MARK_READING" | "COMPLETE") =>
    async (request: FastifyRequest) => {
      const userId = await requireUserId(request);
      const params = parseWithSchema(KhatmSlotParamsSchema, request.params);
      const slot = await repository.mutateKhatmSlot({
        userId,
        roomId: params.roomId,
        campaignId: params.campaignId,
        khatmNumber: params.khatmNumber,
        juzNumber: params.juzNumber,
        action,
        occurredAt: new Date(),
      });
      return KhatmSlotResponseSchema.parse({ slot: serializeSlot(slot) });
    };

  app.post(
    "/api/v1/khatm/rooms/:roomId/campaigns/:campaignId/slots/:khatmNumber/:juzNumber/claim",
    mutate("CLAIM"),
  );
  app.post(
    "/api/v1/khatm/rooms/:roomId/campaigns/:campaignId/slots/:khatmNumber/:juzNumber/release",
    mutate("RELEASE"),
  );
  app.post(
    "/api/v1/khatm/rooms/:roomId/campaigns/:campaignId/slots/:khatmNumber/:juzNumber/reading",
    mutate("MARK_READING"),
  );
  app.post(
    "/api/v1/khatm/rooms/:roomId/campaigns/:campaignId/slots/:khatmNumber/:juzNumber/complete",
    mutate("COMPLETE"),
  );

  app.put<{
    Params: { roomId: string; campaignId: string; khatmNumber: string; juzNumber: string };
  }>(
    "/api/v1/khatm/rooms/:roomId/campaigns/:campaignId/slots/:khatmNumber/:juzNumber/assignment",
    async (request) => {
      const actorUserId = await requireUserId(request);
      const params = parseWithSchema(KhatmSlotParamsSchema, request.params);
      const input = parseWithSchema(KhatmAdminAssignmentInputSchema, request.body);
      const slot = await repository.adminAssignKhatmSlot({
        actorUserId,
        roomId: params.roomId,
        campaignId: params.campaignId,
        khatmNumber: params.khatmNumber,
        juzNumber: params.juzNumber,
        userId: input.userId,
        reopenCompleted: input.reopenCompleted ?? false,
        occurredAt: new Date(),
      });
      return KhatmSlotResponseSchema.parse({ slot: serializeSlot(slot) });
    },
  );

  app.get<{ Params: { roomId: string } }>(
    "/api/v1/khatm/rooms/:roomId/reminders",
    async (request) => {
      const userId = await requireUserId(request);
      const { roomId } = parseWithSchema(KhatmRoomParamsSchema, request.params);
      const reminders = await repository.listKhatmReminders(roomId, userId);
      return KhatmReminderListResponseSchema.parse({
        reminders: reminders.map(serializeReminder),
      });
    },
  );

  app.post<{ Params: { roomId: string } }>(
    "/api/v1/khatm/rooms/:roomId/reminders",
    async (request, reply) => {
      const userId = await requireUserId(request);
      const { roomId } = parseWithSchema(KhatmRoomParamsSchema, request.params);
      const input = parseWithSchema(ScheduleKhatmReminderInputSchema, request.body);
      const scheduledFor = new Date(input.scheduledFor);
      if (scheduledFor <= new Date()) {
        throw new ApiError(400, "REMINDER_IN_PAST", "Choose a future date and time");
      }
      const reminder = await repository.scheduleKhatmReminder({
        actorUserId: userId,
        roomId,
        scheduledFor,
        message: input.message,
      });
      return reply
        .code(201)
        .send(KhatmReminderResponseSchema.parse({ reminder: serializeReminder(reminder) }));
    },
  );

  app.delete<{ Params: { roomId: string; reminderId: string } }>(
    "/api/v1/khatm/rooms/:roomId/reminders/:reminderId",
    async (request) => {
      const userId = await requireUserId(request);
      const { roomId, reminderId } = parseWithSchema(KhatmReminderParamsSchema, request.params);
      const reminder = await repository.cancelKhatmReminder(roomId, reminderId, userId, new Date());
      return KhatmReminderResponseSchema.parse({ reminder: serializeReminder(reminder) });
    },
  );
}
