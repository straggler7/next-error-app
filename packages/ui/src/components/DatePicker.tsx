"use client";

import { useId } from "react";
import { Calendar } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  id?: string;
}

export default function DatePicker({
  value,
  onChange,
  label = "Date",
  placeholder = "Select date...",
  id,
}: DatePickerProps) {
  const generatedId = useId();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;

    if (selectedDate) {
      const [year, month, day] = selectedDate.split("-");
      const formattedDate = `${month}/${day}/${year}`;
      onChange(formattedDate);
      return;
    }

    onChange("");
  };

  const getInputValue = () => {
    if (!value) {
      return "";
    }

    try {
      const [month, day, year] = value.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  const inputId = id ?? generatedId;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <Calendar
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400"
        />
        <input
          id={inputId}
          type="date"
          value={getInputValue()}
          onChange={handleDateChange}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
