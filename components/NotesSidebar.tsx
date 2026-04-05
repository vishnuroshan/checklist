"use client";

import { useEffect, useState, useRef } from "react";
import { dbClient } from "@/lib/db";
import type { GlobalNote } from "@/core/db";

export default function NotesSidebar() {
  const [notesRecord, setNotesRecord] = useState<Record<string, GlobalNote>>({});
  const [newNote, setNewNote] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return dbClient.subscribeGlobalNotes(setNotesRecord);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notesRecord]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    const text = newNote.trim();
    setNewNote(""); // Optimistic clear
    await dbClient.addGlobalNote(text);
  };

  const handleDelete = async (nid: string) => {
    if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      await dbClient.deleteGlobalNote(nid);
    }
  };

  const sortedNotes = Object.entries(notesRecord).sort(
    ([, a], [, b]) => a.createdAt - b.createdAt
  );

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline text-blue-600 hover:text-blue-800 break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={i} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <aside className="w-80 h-screen sticky top-0 border-l border-gray-200 bg-gray-50 flex flex-col shrink-0 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Shared Activity</h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedNotes.length === 0 ? (
          <p className="text-gray-400 italic text-xs text-center py-8">No shared activity yet.</p>
        ) : (
          sortedNotes.map(([id, note]) => (
            <div key={id} className="group relative bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:border-gray-200 transition-all">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">
                  {formatTime(note.createdAt)}
                </span>
                <button
                  onClick={() => handleDelete(id)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-300 hover:text-red-500 font-bold px-1 transition-all"
                >
                  (delete)
                </button>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {renderContent(note.text)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handlePost} className="flex flex-col gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePost(e);
              }
            }}
            placeholder="Type a note..."
            className="w-full text-sm p-2 bg-gray-50 border border-gray-100 rounded focus:outline-none focus:border-blue-200 transition-colors resize-none h-16 shadow-inner"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="bg-gray-100 text-gray-600 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Post Activity
          </button>
        </form>
      </div>
    </aside>
  );
}
