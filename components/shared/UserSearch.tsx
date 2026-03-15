"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X } from "lucide-react";

interface SelectedUser {
  _id: Id<"users">;
  name: string;
  company: string;
  role: string;
}

interface UserSearchProps {
  selectedUsers: SelectedUser[];
  onSelect: (user: SelectedUser) => void;
  onRemove: (userId: Id<"users">) => void;
  excludeIds?: Id<"users">[];
  placeholder?: string;
}

export function UserSearch({
  selectedUsers,
  onSelect,
  onRemove,
  excludeIds = [],
  placeholder = "Search by name or company...",
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const allExcluded = [
    ...excludeIds,
    ...selectedUsers.map((u) => u._id),
  ];

  const results = useQuery(
    api.messaging.queries.searchUsers,
    searchTerm.trim().length >= 2
      ? { searchQuery: searchTerm.trim(), excludeIds: allExcluded }
      : "skip"
  );

  return (
    <div>
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map((user) => (
            <span
              key={user._id}
              className="inline-flex items-center gap-1 bg-accent/10 text-accent text-sm px-3 py-1 rounded-full"
            >
              {user.name}
              <button
                type="button"
                onClick={() => onRemove(user._id)}
                aria-label={`Remove ${user.name}`}
                className="text-accent/60 hover:text-accent transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-mist rounded-lg px-3 py-2 bg-surface text-text-deep placeholder:text-slate-custom focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-accent transition-colors"
      />

      {results && results.length > 0 && (
        <div className="mt-1 border border-mist rounded-lg bg-surface shadow-lg max-h-48 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user._id}
              type="button"
              onClick={() => {
                onSelect(user);
                setSearchTerm("");
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-cloud transition-colors cursor-pointer flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-semibold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-text-deep">{user.name}</p>
                <p className="text-xs text-slate-custom">
                  {user.company} · {user.role === "vendor" ? "Vendor" : "Facility Manager"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {results && results.length === 0 && searchTerm.trim().length >= 2 && (
        <p className="mt-1 text-xs text-slate-custom px-1">No users found</p>
      )}
    </div>
  );
}

export type { SelectedUser };
