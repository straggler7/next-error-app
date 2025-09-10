'use client';

import { useState } from 'react';
import { Note } from '../types';

interface NotesSectionProps {
  notes: Note[];
  onAddNote?: (content: string) => void;
}

export default function NotesSection({ notes, onAddNote }: NotesSectionProps) {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim() && onAddNote) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Existing Notes */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        <div className="font-semibold text-gray-700 mb-3 text-sm">Existing Notes</div>
        <div className="space-y-3">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                <div className="text-xs text-gray-600 font-medium mb-1">{note.timestamp}</div>
                <div className="text-sm text-gray-700 leading-relaxed">{note.content}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 italic">No notes available</div>
          )}
        </div>
      </div>

      {/* Add New Note */}
      <div className="flex-shrink-0 border-t border-gray-200 pt-4">
        <div className="font-semibold text-gray-700 mb-3 text-sm">Add New Note</div>
        <div className="space-y-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note here..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none text-sm transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            rows={3}
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm"
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
