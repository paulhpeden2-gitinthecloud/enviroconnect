"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({ userId }: { userId: Id<"users"> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = useQuery(api.rfq.queries.getUnreadNotificationCount, { userId });
  const notifications = useQuery(api.rfq.queries.getNotifications, { userId });
  const markRead = useMutation(api.rfq.mutations.markNotificationRead);
  const markAllRead = useMutation(api.rfq.mutations.markAllNotificationsRead);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (notificationId: Id<"notifications">) => {
    markRead({ notificationId, userId });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-custom hover:text-text-deep hover:bg-cloud transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount! > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-mist rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-mist">
            <h3 className="text-sm font-semibold text-text-deep">Notifications</h3>
            {(unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllRead({ userId })}
                className="text-xs text-accent hover:text-accent-hover hover:underline transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications?.length === 0 && (
              <p className="text-sm text-slate-custom text-center py-6">No notifications</p>
            )}
            {notifications?.slice(0, 20).map((n) => {
              const isMeetingNotification = n.type.startsWith("meeting_");
              const href = isMeetingNotification
                ? `/meetings`
                : n.rfqId
                  ? `/rfq/${n.rfqId}`
                  : `/dashboard`;
              return (
                <Link
                  key={n._id}
                  href={href}
                  onClick={() => handleClick(n._id)}
                  className={`block px-4 py-3 text-sm border-b border-mist last:border-0 hover:bg-cloud transition-colors ${
                    !n.isRead ? "bg-accent/5" : ""
                  }`}
                >
                  <p className={`${!n.isRead ? "text-text-deep font-medium" : "text-slate-custom"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-custom mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
