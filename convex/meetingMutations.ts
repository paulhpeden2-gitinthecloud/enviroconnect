import { mutation } from "./_generated/server";
import { v } from "convex/values";

const timeSlotValidator = v.object({
  date: v.number(),
  startTime: v.string(),
  endTime: v.string(),
});

export const createMeetingRequest = mutation({
  args: {
    requesterId: v.id("users"),
    recipientId: v.id("users"),
    subject: v.string(),
    note: v.optional(v.string()),
    meetingType: v.union(v.literal("phone"), v.literal("video"), v.literal("in_person")),
    rfqId: v.optional(v.id("rfqs")),
    proposedSlots: v.array(timeSlotValidator),
  },
  handler: async (ctx, args) => {
    if (args.requesterId === args.recipientId) {
      throw new Error("Cannot schedule a meeting with yourself");
    }
    if (args.proposedSlots.length === 0 || args.proposedSlots.length > 3) {
      throw new Error("Must propose 1-3 time slots");
    }

    const requester = await ctx.db.get(args.requesterId);
    if (!requester) throw new Error("User not found");

    const now = Date.now();
    const meetingId = await ctx.db.insert("meetingRequests", {
      requesterId: args.requesterId,
      recipientId: args.recipientId,
      subject: args.subject,
      note: args.note,
      meetingType: args.meetingType,
      rfqId: args.rfqId,
      proposedSlots: args.proposedSlots,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: args.recipientId,
      type: "meeting_request",
      meetingRequestId: meetingId,
      message: `${requester.name} (${requester.company}) wants to schedule a meeting: "${args.subject}"`,
      isRead: false,
      createdAt: now,
    });

    return meetingId;
  },
});

export const acceptMeetingSlot = mutation({
  args: {
    meetingRequestId: v.id("meetingRequests"),
    userId: v.id("users"),
    slot: timeSlotValidator,
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingRequestId);
    if (!meeting) throw new Error("Meeting request not found");

    const isRecipientAccepting = meeting.recipientId === args.userId && meeting.status === "pending";
    const isRequesterAccepting = meeting.requesterId === args.userId && meeting.status === "counterproposed";

    if (!isRecipientAccepting && !isRequesterAccepting) {
      throw new Error("Not authorized to accept this meeting");
    }

    const now = Date.now();
    await ctx.db.patch(args.meetingRequestId, {
      confirmedSlot: args.slot,
      status: "confirmed",
      updatedAt: now,
    });

    const accepter = await ctx.db.get(args.userId);
    const notifyUserId = isRecipientAccepting ? meeting.requesterId : meeting.recipientId;
    const slotDate = new Date(args.slot.date).toLocaleDateString();

    await ctx.db.insert("notifications", {
      userId: notifyUserId,
      type: "meeting_confirmed",
      meetingRequestId: args.meetingRequestId,
      message: `${accepter?.name} confirmed your meeting "${meeting.subject}" for ${slotDate} at ${args.slot.startTime}`,
      isRead: false,
      createdAt: now,
    });
  },
});

export const counterProposeMeeting = mutation({
  args: {
    meetingRequestId: v.id("meetingRequests"),
    recipientId: v.id("users"),
    counterSlots: v.array(timeSlotValidator),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingRequestId);
    if (!meeting) throw new Error("Meeting request not found");
    if (meeting.recipientId !== args.recipientId) throw new Error("Unauthorized");
    if (meeting.status !== "pending") throw new Error("Meeting is not pending");
    if (args.counterSlots.length === 0 || args.counterSlots.length > 3) {
      throw new Error("Must propose 1-3 counter time slots");
    }

    const now = Date.now();
    await ctx.db.patch(args.meetingRequestId, {
      counterSlots: args.counterSlots,
      status: "counterproposed",
      updatedAt: now,
    });

    const recipient = await ctx.db.get(args.recipientId);
    await ctx.db.insert("notifications", {
      userId: meeting.requesterId,
      type: "meeting_counterproposal",
      meetingRequestId: args.meetingRequestId,
      message: `${recipient?.name} suggested alternative times for "${meeting.subject}"`,
      isRead: false,
      createdAt: now,
    });
  },
});

export const declineMeeting = mutation({
  args: {
    meetingRequestId: v.id("meetingRequests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.meetingRequestId);
    if (!meeting) throw new Error("Meeting request not found");

    const isRecipient = meeting.recipientId === args.userId;
    const isRequester = meeting.requesterId === args.userId;
    if (!isRecipient && !isRequester) throw new Error("Unauthorized");
    if (meeting.status === "confirmed" || meeting.status === "declined" || meeting.status === "expired") {
      throw new Error("Meeting cannot be declined in current state");
    }

    const now = Date.now();
    await ctx.db.patch(args.meetingRequestId, {
      status: "declined",
      updatedAt: now,
    });

    const decliner = await ctx.db.get(args.userId);
    const notifyUserId = isRecipient ? meeting.requesterId : meeting.recipientId;
    await ctx.db.insert("notifications", {
      userId: notifyUserId,
      type: "meeting_declined",
      meetingRequestId: args.meetingRequestId,
      message: `${decliner?.name} declined the meeting request: "${meeting.subject}"`,
      isRead: false,
      createdAt: now,
    });
  },
});
