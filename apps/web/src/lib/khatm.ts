import {
  type CreateKhatmRoomInput,
  CreateKhatmRoomInputSchema,
  type KhatmCampaignSummary,
  KhatmCampaignListResponseSchema,
  type KhatmInvitePreview,
  KhatmInvitePreviewResponseSchema,
  KhatmJoinCredentialSchema,
  type KhatmParaSlot,
  type KhatmReminder,
  KhatmReminderListResponseSchema,
  KhatmReminderResponseSchema,
  type KhatmRoom,
  KhatmRoomListResponseSchema,
  KhatmRoomResponseSchema,
  type KhatmRoomSummary,
  KhatmSlotResponseSchema,
  type ScheduleKhatmReminderInput,
  ScheduleKhatmReminderInputSchema,
  type StartNextKhatmCampaignInput,
  StartNextKhatmCampaignInputSchema,
  type UpdateKhatmRoomInput,
  UpdateKhatmRoomInputSchema,
} from "@quran-feham/contracts";
import { apiRequest } from "./api";

export type KhatmSlotAction = "claim" | "release" | "reading" | "complete";

/** Accept either a raw invitation code or the links shared by Quran Feham. */
export function extractInviteCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const queryCode = url.searchParams.get("join") ?? url.searchParams.get("inviteCode");
    if (queryCode) return queryCode.trim();
    const pathMatch = /\/join\/([^/?#]+)/.exec(url.pathname);
    if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]).trim();
  } catch {
    // A raw code is the most common input and is intentionally accepted.
  }

  return trimmed;
}

export function isValidInviteCode(value: string): boolean {
  return KhatmJoinCredentialSchema.safeParse(extractInviteCode(value)).success;
}

export function buildInviteLink(origin: string, credential: string): string {
  const code = KhatmJoinCredentialSchema.parse(credential);
  const cleanOrigin =
    !origin || origin.includes("localhost") || origin.includes("127.0.0.1")
      ? "https://fehmequran.org"
      : origin;
  const url = new URL(`/join/${encodeURIComponent(code)}`, cleanOrigin);
  return url.toString();
}

export function summarizeSlots(slots: readonly KhatmParaSlot[]) {
  const summary = { available: 0, claimed: 0, reading: 0, completed: 0, total: slots.length };
  for (const slot of slots) summary[slot.status] += 1;
  return summary;
}

export function groupSlotsByKhatm(slots: readonly KhatmParaSlot[]): Map<number, KhatmParaSlot[]> {
  const grouped = new Map<number, KhatmParaSlot[]>();
  for (const slot of slots) {
    const group = grouped.get(slot.khatmNumber) ?? [];
    group.push(slot);
    grouped.set(slot.khatmNumber, group);
  }
  for (const group of grouped.values())
    group.sort((left, right) => left.juzNumber - right.juzNumber);
  return grouped;
}

export async function listKhatmRooms(): Promise<KhatmRoomSummary[]> {
  return KhatmRoomListResponseSchema.parse(await apiRequest("/khatm/rooms")).rooms;
}

export async function getKhatmRoom(roomId: string): Promise<KhatmRoom> {
  return KhatmRoomResponseSchema.parse(
    await apiRequest(`/khatm/rooms/${encodeURIComponent(roomId)}`),
  ).room;
}

export async function createKhatmRoom(input: CreateKhatmRoomInput): Promise<KhatmRoom> {
  const payload = CreateKhatmRoomInputSchema.parse(input);
  return KhatmRoomResponseSchema.parse(
    await apiRequest("/khatm/rooms", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  ).room;
}

export async function joinKhatmRoom(invitation: string): Promise<KhatmRoom> {
  const inviteCode = KhatmJoinCredentialSchema.parse(extractInviteCode(invitation));
  return KhatmRoomResponseSchema.parse(
    await apiRequest("/khatm/rooms/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    }),
  ).room;
}

export async function getKhatmInvitePreview(invitation: string): Promise<KhatmInvitePreview> {
  const credential = KhatmJoinCredentialSchema.parse(extractInviteCode(invitation));
  return KhatmInvitePreviewResponseSchema.parse(
    await apiRequest(`/khatm/invitations/${encodeURIComponent(credential)}`),
  ).invitation;
}

export async function updateKhatmRoom(
  roomId: string,
  input: UpdateKhatmRoomInput,
): Promise<KhatmRoom> {
  const payload = UpdateKhatmRoomInputSchema.parse(input);
  return KhatmRoomResponseSchema.parse(
    await apiRequest(`/khatm/rooms/${encodeURIComponent(roomId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  ).room;
}

export async function rotateKhatmInvitation(roomId: string): Promise<KhatmRoom> {
  return KhatmRoomResponseSchema.parse(
    await apiRequest(`/khatm/rooms/${encodeURIComponent(roomId)}/invitation/rotate`, {
      method: "POST",
    }),
  ).room;
}

export async function removeKhatmMember(roomId: string, userId: string): Promise<void> {
  await apiRequest(
    `/khatm/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

export async function listKhatmCampaigns(roomId: string): Promise<KhatmCampaignSummary[]> {
  return KhatmCampaignListResponseSchema.parse(
    await apiRequest(`/khatm/rooms/${encodeURIComponent(roomId)}/campaigns`),
  ).campaigns;
}

export async function startNextKhatmCampaign(
  roomId: string,
  input: StartNextKhatmCampaignInput,
): Promise<KhatmRoom> {
  const payload = StartNextKhatmCampaignInputSchema.parse(input);
  return KhatmRoomResponseSchema.parse(
    await apiRequest(`/khatm/rooms/${encodeURIComponent(roomId)}/campaigns/next`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  ).room;
}

export async function assignKhatmPara(
  roomId: string,
  campaignId: string,
  khatmNumber: number,
  juzNumber: number,
  userId: string | null,
  reopenCompleted = false,
): Promise<KhatmParaSlot> {
  const path = [
    "/khatm/rooms",
    encodeURIComponent(roomId),
    "campaigns",
    encodeURIComponent(campaignId),
    "slots",
    String(khatmNumber),
    String(juzNumber),
    "assignment",
  ].join("/");
  return KhatmSlotResponseSchema.parse(
    await apiRequest(path, {
      method: "PUT",
      body: JSON.stringify({ userId, ...(reopenCompleted ? { reopenCompleted: true } : {}) }),
    }),
  ).slot;
}

export async function listKhatmReminders(roomId: string): Promise<KhatmReminder[]> {
  return KhatmReminderListResponseSchema.parse(
    await apiRequest(`/khatm/rooms/${encodeURIComponent(roomId)}/reminders`),
  ).reminders;
}

export async function scheduleKhatmReminder(
  roomId: string,
  input: ScheduleKhatmReminderInput,
): Promise<KhatmReminder> {
  const payload = ScheduleKhatmReminderInputSchema.parse(input);
  return KhatmReminderResponseSchema.parse(
    await apiRequest(`/khatm/rooms/${encodeURIComponent(roomId)}/reminders`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  ).reminder;
}

export async function cancelKhatmReminder(
  roomId: string,
  reminderId: string,
): Promise<KhatmReminder> {
  return KhatmReminderResponseSchema.parse(
    await apiRequest(
      `/khatm/rooms/${encodeURIComponent(roomId)}/reminders/${encodeURIComponent(reminderId)}`,
      { method: "DELETE" },
    ),
  ).reminder;
}

export async function mutateKhatmSlot(
  roomId: string,
  campaignId: string,
  khatmNumber: number,
  juzNumber: number,
  action: KhatmSlotAction,
): Promise<KhatmParaSlot> {
  const path = [
    "/khatm/rooms",
    encodeURIComponent(roomId),
    "campaigns",
    encodeURIComponent(campaignId),
    "slots",
    String(khatmNumber),
    String(juzNumber),
    action,
  ].join("/");
  return KhatmSlotResponseSchema.parse(await apiRequest(path, { method: "POST" })).slot;
}
