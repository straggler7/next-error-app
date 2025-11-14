'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ComboBoxOption {
  value: string;
  label: string;
  seid: string;
}

interface ComboBoxProps {
  options: ComboBoxOption[];
  placeholder?: string;
  onSelect: (option: ComboBoxOption | null) => void;
  value?: string;
  className?: string;
  disabled?: boolean;
}

export default function ComboBox({ 
  options, 
  placeholder = "Enter SEID or select from dropdown...", 
  onSelect, 
  value = "",
  className = "",
  disabled = false,
}: ComboBoxProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const searchTerm = inputValue.toLowerCase();
    const filtered = options.filter(option => 
      option.label.toLowerCase().includes(searchTerm) || 
      option.seid.toLowerCase().includes(searchTerm)
    );
    setFilteredOptions(filtered);
    setHighlightedIndex(-1);

    // Check for exact SEID match and prevent duplicate calls
    const exactMatch = options.find(option => option.seid === inputValue);
    const currentSelection = exactMatch ? exactMatch.seid : (inputValue === '' ? 'empty' : null);
    
    if (currentSelection !== lastSelectedRef.current) {
      lastSelectedRef.current = currentSelection;
      if (exactMatch) {
        onSelect(exactMatch);
      } else if (inputValue === '') {
        onSelect(null);
      }
    }
  }, [inputValue, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (disabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleOptionClick = (option: ComboBoxOption) => {
    setInputValue(option.seid);
    setIsOpen(false);
    lastSelectedRef.current = option.seid;
    onSelect(option);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 pr-10 py-3 border-2 rounded-lg text-sm transition-all duration-150 focus:outline-none focus:bg-white focus:shadow-sm
            ${disabled
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 focus:border-blue-600'
            }`}
        />
        <ChevronDown 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" 
        />
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto z-50 mt-1"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                  index === highlightedIndex 
                    ? 'bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="text-sm text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500">SEID: {option.seid}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
