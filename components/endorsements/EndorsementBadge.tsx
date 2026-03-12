"use client";

interface EndorsementBadgeProps {
  peerCount: number;
  clientCount: number;
  onPeerClick?: () => void;
  onClientClick?: () => void;
  size?: "sm" | "md";
}

export function EndorsementBadge({
  peerCount,
  clientCount,
  onPeerClick,
  onClientClick,
  size = "sm",
}: EndorsementBadgeProps) {
  if (peerCount === 0 && clientCount === 0) return null;

  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-2">
      {peerCount > 0 && (
        <button
          type="button"
          onClick={onPeerClick}
          className={`${textSize} text-gray-500 dark:text-gray-400 hover:text-green transition-colors flex items-center gap-1 cursor-pointer`}
        >
          <svg
            className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          {peerCount} peer
        </button>
      )}
      {peerCount > 0 && clientCount > 0 && (
        <span className={`${textSize} text-gray-300 dark:text-gray-600`}>·</span>
      )}
      {clientCount > 0 && (
        <button
          type="button"
          onClick={onClientClick}
          className={`${textSize} text-gray-500 dark:text-gray-400 hover:text-green transition-colors flex items-center gap-1 cursor-pointer`}
        >
          <svg
            className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
            />
          </svg>
          {clientCount} client
        </button>
      )}
    </div>
  );
}
