'use client';

import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function FormSection({ title, children, className = '' }: FormSectionProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="mb-6 pb-3 border-b-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  success, 
  children, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-tight">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <span className="block text-red-600 text-xs mt-2 font-medium leading-tight">
          {error}
        </span>
      )}
      {success && (
        <span className="block text-green-600 text-xs mt-1.5 font-medium italic leading-tight">
          {success}
        </span>
      )}
    </div>
  );
}

interface FormInputProps {
  type?: string;
  step?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  className?: string;
}

export function FormInput({ 
  type = 'text', 
  step,
  placeholder, 
  value, 
  onChange, 
  error = false,
  className = '' 
}: FormInputProps) {
  return (
    <input
      type={type}
      step={step}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`
        w-full px-4 py-3.5 border rounded-md text-sm transition-all duration-150 bg-gray-50 text-gray-700
        ${error 
          ? 'border-red-600 focus:border-red-600 focus:ring-3 focus:ring-red-100' 
          : 'border-gray-300 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100'
        }
        focus:outline-none ${className}
      `}
    />
  );
}

interface FormSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormSelect({ 
  value, 
  onChange, 
  error = false, 
  children, 
  className = '' 
}: FormSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={`
        w-full px-4 py-3.5 border rounded-md text-sm transition-all duration-150 bg-gray-50 text-gray-700 cursor-pointer
        ${error 
          ? 'border-red-600 focus:border-red-600 focus:ring-3 focus:ring-red-100' 
          : 'border-gray-300 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100'
        }
        focus:outline-none ${className}
      `}
    >
      {children}
    </select>
  );
}

interface FormTextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  rows?: number;
  className?: string;
}

export function FormTextarea({ 
  placeholder, 
  value, 
  onChange, 
  error = false, 
  rows = 4,
  className = '' 
}: FormTextareaProps) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      rows={rows}
      className={`
        w-full px-4 py-3.5 border rounded-md text-sm transition-all duration-150 bg-gray-50 text-gray-700 resize-vertical leading-relaxed
        ${error 
          ? 'border-red-600 focus:border-red-600 focus:ring-3 focus:ring-red-100' 
          : 'border-gray-300 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100'
        }
        focus:outline-none ${className}
      `}
    />
  );
}
