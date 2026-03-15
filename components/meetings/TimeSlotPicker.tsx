"use client";
import { useState } from "react";

export interface TimeSlot {
  date: number;
  startTime: string;
  endTime: string;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
  maxSlots?: number;
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

const timeInputClass =
  "bg-surface border border-mist rounded-md px-3 py-2 text-sm text-deep focus:outline-none focus:border-primary focus:ring-2 focus:ring-focus-ring/40";

export function TimeSlotPicker({ slots, onChange, maxSlots = 3 }: TimeSlotPickerProps) {
  const addSlot = () => {
    if (slots.length >= maxSlots) return;
    onChange([...slots, { date: 0, startTime: "09:00", endTime: "10:00" }]);
  };

  const removeSlot = (index: number) => {
    onChange(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updated = slots.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            min={todayString()}
            value={slot.date ? new Date(slot.date).toISOString().split("T")[0] : ""}
            onChange={(e) => {
              const d = new Date(e.target.value + "T00:00:00");
              updateSlot(i, "date", d.getTime());
            }}
            className={timeInputClass}
          />
          <input
            type="time"
            value={slot.startTime}
            onChange={(e) => updateSlot(i, "startTime", e.target.value)}
            className={timeInputClass}
          />
          <span className="text-slate-custom text-sm">to</span>
          <input
            type="time"
            value={slot.endTime}
            onChange={(e) => updateSlot(i, "endTime", e.target.value)}
            className={timeInputClass}
          />
          {slots.length > 1 && (
            <button
              type="button"
              onClick={() => removeSlot(i)}
              className="text-danger hover:text-danger/80 transition-colors p-1"
              aria-label="Remove slot"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {slots.length < maxSlots && (
        <button
          type="button"
          onClick={addSlot}
          className="text-sm text-accent hover:underline font-medium"
        >
          + Add another time option
        </button>
      )}
    </div>
  );
}
