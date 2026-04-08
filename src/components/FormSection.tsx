'use client';

import React, { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

interface FormSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  metadata?: {
    receivedDate?: string;
    taxPeriod?: string;
  };
}

export default function FormSection({ title, children, className = '', metadata }: FormSectionProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="mb-4 pb-3 border-b-2 border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h3>
        {metadata && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-bold">Received Date:</span> {metadata.receivedDate || 'N/A'} | <span className="font-bold">Tax Period:</span> {metadata.taxPeriod || 'N/A'}
          </div>
        )}
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
  originalValue?: string;
  currentValue?: string;
  showChangeIndicator?: boolean;
  isHighlighted?: boolean;
  htmlFor?: string;
}

export function FormField({ 
  label, 
  required = false, 
  error, 
  success, 
  children, 
  className = '',
  originalValue,
  currentValue,
  showChangeIndicator = false,
  isHighlighted = false,
  htmlFor
}: FormFieldProps) {
  const hasChanged = showChangeIndicator && originalValue && currentValue && originalValue !== currentValue;
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;
  const successId = success && htmlFor ? `${htmlFor}-success` : undefined;
  const childAriaDescribedBy = React.isValidElement(children)
    ? (children.props as { 'aria-describedby'?: string })['aria-describedby']
    : undefined;
  const describedBy = [childAriaDescribedBy, errorId, successId].filter(Boolean).join(' ') || undefined;
  
  return (
    <div className={`mb-2 ${className} ${isHighlighted ? 'ring-1 ring-red-200 ring-opacity-50 rounded-md p-2 bg-red-50' : ''}`}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-2 tracking-tight">
        {label}
        {required && (
          <>
            <span className="text-red-600 ml-1" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </label>
      {/* Clone children and add ARIA attributes for 508 compliance */}
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            'aria-describedby': describedBy,
            'aria-invalid': error ? 'true' : undefined,
            required,
            'aria-required': required ? 'true' : undefined
          })
        : children
      }
      {hasChanged && (
        <div className="mt-1 text-xs text-gray-600 font-medium flex items-center gap-1">
          Changed: {originalValue} <ArrowRight className="w-3 h-3" /> {currentValue}
        </div>
      )}
      {error && (
        <span 
          id={errorId}
          className="block text-red-600 text-xs mt-2 font-medium leading-tight"
          role="alert"
          aria-live="polite"
        >
          {error}
        </span>
      )}
      {success && (
        <span 
          id={successId}
          className="block text-green-600 text-xs mt-1.5 font-medium italic leading-tight"
          role="status"
          aria-live="polite"
        >
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
  onBlur?: () => void;
  error?: boolean;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  'aria-required'?: boolean | 'true' | 'false';
  'aria-disabled'?: boolean | 'true' | 'false';
}

export function FormInput({ 
  type = 'text', 
  step,
  placeholder, 
  value, 
  onChange, 
  onBlur,
  error = false,
  className = '',
  disabled = false,
  readOnly = false,
  id,
  required,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  'aria-disabled': ariaDisabled
}: FormInputProps) {
  const isReadOnlyLike = disabled || readOnly || ariaDisabled === true || ariaDisabled === 'true';

  return (
    <input
      id={id}
      type={type}
      step={step}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      aria-describedby={ariaDescribedby}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      aria-disabled={ariaDisabled}
      className={`
        w-full px-4 py-3 border rounded-md text-sm transition-all duration-150
        ${isReadOnlyLike ? 'bg-gray-200 text-gray-600 border-gray-400 cursor-not-allowed opacity-90' : 'bg-white text-gray-700'}
        ${error 
          ? 'border-red-600 focus:border-red-600 focus:ring-3 focus:ring-red-100' 
          : isReadOnlyLike
            ? 'border-1 border-gray-400 focus:border-blue-600 focus:bg-gray-200 focus:ring-2 focus:ring-blue-100'
            : 'border-gray-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100'
        }
        focus:outline-none ${className}
      `}
    />
  );
}

interface FormSelectProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  'aria-required'?: boolean | 'true' | 'false';
  'aria-disabled'?: boolean | 'true' | 'false';
  children: ReactNode;
  className?: string;
}

export function FormSelect({ 
  id,
  value, 
  onChange, 
  onBlur,
  disabled = false,
  required,
  error = false, 
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  'aria-required': ariaRequired,
  'aria-disabled': ariaDisabled,
  children, 
  className = '' 
}: FormSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      aria-describedby={ariaDescribedby}
      aria-invalid={ariaInvalid}
      aria-required={ariaRequired}
      aria-disabled={ariaDisabled}
      className={`
        w-full px-4 py-3 border rounded-md text-sm transition-all duration-150 bg-gray-50 text-gray-700 cursor-pointer
        ${error 
          ? 'border-red-600 focus:border-red-600 focus:ring-2 focus:ring-red-100' 
          : 'border-gray-300 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100'
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
        w-full px-4 py-3 border rounded-md text-sm transition-all duration-150 bg-gray-50 text-gray-700 resize-vertical leading-relaxed
        ${error 
          ? 'border-red-600 focus:border-red-600 focus:ring-3 focus:ring-red-100' 
          : 'border-gray-300 focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100'
        }
        focus:outline-none ${className}
      `}
    />
  );
}
