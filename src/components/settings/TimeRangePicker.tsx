import React from 'react';

interface TimeRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  disabled?: boolean;
}

export default function TimeRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  disabled = false
}: TimeRangePickerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <label className="block text-sm theme-text opacity-70 mb-1">Da</label>
        <input
          type="time"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-full p-2 rounded-md theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          disabled={disabled}
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm theme-text opacity-70 mb-1">A</label>
        <input
          type="time"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="w-full p-2 rounded-md theme-bg-secondary theme-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          disabled={disabled}
        />
      </div>
    </div>
  );
}