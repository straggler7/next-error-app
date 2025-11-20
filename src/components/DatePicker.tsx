'use client';

import { Calendar } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
}

export default function DatePicker({ 
  value, 
  onChange, 
  label = 'Date', 
  placeholder = 'Select date...' 
}: DatePickerProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      // Convert from YYYY-MM-DD to MM/DD/YYYY format
      const date = new Date(selectedDate);
      const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      onChange(formattedDate);
    } else {
      onChange('');
    }
  };

  // Convert from MM/DD/YYYY to YYYY-MM-DD format for input
  const getInputValue = () => {
    if (!value) return '';
    try {
      const [month, day, year] = value.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="date"
          value={getInputValue()}
          onChange={handleDateChange}
          placeholder={placeholder}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full"
        />
      </div>
    </div>
  );
}
