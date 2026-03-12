import { query } from "../_generated/server";
import { v } from "convex/values";

export const getMyMeetings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asRequester = await ctx.db
      .query("meetingRequests")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.userId))
      .collect();
    const asRecipient = await ctx.db
      .query("meetingRequests")
      .withIndex("by_recipientId", (q) => q.eq("recipientId", args.userId))
      .collect();

    const all = [...asRequester, ...asRecipient];
    const seen = new Set<string>();
    const unique = all.filter((m) => {
      if (seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });

    const enriched = await Promise.all(
      unique.map(async (m) => {
        const requester = await ctx.db.get(m.requesterId);
        const recipient = await ctx.db.get(m.recipientId);
        return { ...m, requester, recipient };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getMeetingRequest = query({
  args: { id: v.id("meetingRequests") },
  handler: async (ctx, args) => {
    const meeting = await ctx.db.get(args.id);
    if (!meeting) return null;
    const requester = await ctx.db.get(meeting.requesterId);
    const recipient = await ctx.db.get(meeting.recipientId);
    return { ...meeting, requester, recipient };
  },
});

export const getUpcomingMeetings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asRequester = await ctx.db
      .query("meetingRequests")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.userId))
      .collect();
    const asRecipient = await ctx.db
      .query("meetingRequests")
      .withIndex("by_recipientId", (q) => q.eq("recipientId", args.userId))
      .collect();

    const all = [...asRequester, ...asRecipient];
    const now = Date.now();
    const upcoming = all.filter(
      (m) => m.status === "confirmed" && m.confirmedSlot && m.confirmedSlot.date >= now
    );

    const enriched = await Promise.all(
      upcoming.map(async (m) => {
        const requester = await ctx.db.get(m.requesterId);
        const recipient = await ctx.db.get(m.recipientId);
        return { ...m, requester, recipient };
      })
    );

    return enriched.sort((a, b) => (a.confirmedSlot!.date - b.confirmedSlot!.date));
  },
});

export const getPendingMeetingCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asRecipientPending = await ctx.db
      .query("meetingRequests")
      .withIndex("by_recipientId", (q) => q.eq("recipientId", args.userId))
      .collect();
    const asRequesterCounter = await ctx.db
      .query("meetingRequests")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", args.userId))
      .collect();

    const pendingCount = asRecipientPending.filter((m) => m.status === "pending").length;
    const counterCount = asRequesterCounter.filter((m) => m.status === "counterproposed").length;

    return pendingCount + counterCount;
  },
});
