"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

export function NotificationBell({ userId }: { userId: Id<"users"> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = useQuery(api.rfqs.getUnreadNotificationCount, { userId });
  const notifications = useQuery(api.rfqs.getNotifications, { userId });
  const markRead = useMutation(api.rfqMutations.markNotificationRead);
  const markAllRead = useMutation(api.rfqMutations.markAllNotificationsRead);

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
        className="relative p-2 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount! > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-navy-light border border-cream-dark rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream-dark">
            <h3 className="text-sm font-semibold text-navy dark:text-white">Notifications</h3>
            {(unreadCount ?? 0) > 0 && (
              <button
                onClick={() => markAllRead({ userId })}
                className="text-xs text-green hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No notifications</p>
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
                  className={`block px-4 py-3 text-sm border-b border-cream-dark last:border-0 hover:bg-cream dark:hover:bg-navy transition-colors ${
                    !n.isRead ? "bg-green/5" : ""
                  }`}
                >
                  <p className={`text-gray-700 dark:text-gray-300 ${!n.isRead ? "font-medium" : ""}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
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
