'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ErrorItem } from '../types';

interface ErrorSidebarProps {
  errors: ErrorItem[];
  onErrorSelect?: (error: ErrorItem) => void;
}

export default function ErrorSidebar({ errors, onErrorSelect }: ErrorSidebarProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'updated'>('active');
  const [expandedErrors, setExpandedErrors] = useState<string[]>([]);

  const activeErrors = errors.filter(error => error.status === 'active');
  const updatedErrors = errors.filter(error => error.status === 'updated');

  const toggleErrorExpansion = (errorId: string) => {
    setExpandedErrors(prev => 
      prev.includes(errorId) 
        ? prev.filter(id => id !== errorId)
        : [...prev, errorId]
    );
  };

  const renderErrorList = (errorList: ErrorItem[]) => (
    <ul className="space-y-3">
      {errorList.map((error) => (
        <li key={error.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
          <div 
            className="p-4 cursor-pointer bg-gray-50 transition-colors hover:bg-gray-100"
            onClick={() => toggleErrorExpansion(error.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  <span className="inline-block bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold font-mono border border-red-200 w-fit">
                    {error.code}
                  </span>
                  <p className="text-sm text-gray-600 font-medium leading-tight">
                    {error.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className={`
                  px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide
                  ${error.status === 'active' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : error.status === 'updated'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                  }
                `}>
                  {error.status}
                </span>
                {expandedErrors.includes(error.id) ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </div>
            </div>
          </div>
          
          {expandedErrors.includes(error.id) && error.irm && (
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">{error.irm.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">{error.irm.content}</p>
                {error.irm.steps && (
                  <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 pl-2">
                    {error.irm.steps.map((step, index) => (
                      <li key={index} className="leading-relaxed">{step}</li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors">
                  Mark Updated
                </button>
                <button className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors">
                  Mark Active
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full">
      <div className="p-4 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Errors</h3>
        
        {/* Error Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active ({errors.filter(e => e.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('updated')}
            className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'updated'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Updated ({errors.filter(e => e.status === 'updated').length})
          </button>
        </div>
      </div>

      {/* Error List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {activeTab === 'active' && renderErrorList(activeErrors)}
          {activeTab === 'updated' && renderErrorList(updatedErrors)}
        </div>
      </div>
    </div>
  );
}
