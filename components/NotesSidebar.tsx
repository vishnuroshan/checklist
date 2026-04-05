"use client";

import { useEffect, useState, useRef } from "react";
import { dbClient } from "@/lib/db";
import type { GlobalNote } from "@/core/db";
import { useAuth } from "@/hooks/useAuth";

export default function NotesSidebar() {
  const { isLoggedIn } = useAuth();
  const [notesRecord, setNotesRecord] = useState<Record<string, GlobalNote>>({});
  const [newNote, setNewNote] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    return dbClient.subscribeGlobalNotes(setNotesRecord);
  }, []);

  useEffect(() => {
    if (scrollRef.current && !Object.values(noteRefs.current).some(r => r === document.activeElement)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notesRecord]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    const text = newNote.trim();
    setNewNote(""); 
    await dbClient.addGlobalNote(text);
  };

  const handleDelete = async (nid: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await dbClient.deleteGlobalNote(nid);
    }
  };

  const handleTogglePin = async (nid: string, pinned: boolean) => {
    if (!pinned) {
      await dbClient.togglePinGlobalNote(nid, false);
      return;
    }

    const pinnedCount = Object.values(notesRecord).filter(n => n.pinned).length;
    if (pinnedCount >= 5) {
      alert("Maximum of 5 pinned notes allowed. Unpin someone else first.");
      return;
    }

    await dbClient.togglePinGlobalNote(nid, true);
  };

  const scrollToNote = (nid: string) => {
    const el = noteRefs.current[nid];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
      setTimeout(() => el.classList.remove("ring-2", "ring-blue-400", "ring-offset-2"), 2000);
    }
  };

  const sortedNotes = Object.entries(notesRecord).sort(
    ([, a], [, b]) => a.createdAt - b.createdAt
  );

  const pinnedNotes = Object.entries(notesRecord)
    .filter(([, n]) => n.pinned)
    .sort(([, a], [, b]) => b.createdAt - a.createdAt);

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

      {pinnedNotes.length > 0 && (
        <div className="bg-blue-50/50 border-b border-blue-100 p-3 space-y-2">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Important</div>
          <div className="flex flex-wrap gap-2">
            {pinnedNotes.map(([id, note]) => (
              <button
                key={id}
                onClick={() => scrollToNote(id)}
                className="text-[11px] bg-white border border-blue-100 text-blue-600 px-2 py-1 rounded shadow-sm hover:border-blue-400 transition-all font-medium truncate max-w-[120px]"
              >
                Jump to Note
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {sortedNotes.length === 0 ? (
          <p className="text-gray-400 italic text-xs text-center py-8">No shared activity yet.</p>
        ) : (
          sortedNotes.map(([id, note]) => (
            <div 
              key={id} 
              ref={el => { noteRefs.current[id] = el; }}
              className={`group relative border rounded-lg p-3 shadow-sm hover:shadow transition-all ${note.pinned ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-gray-100'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">
                  {formatTime(note.createdAt)} {note.pinned && "· PINNED"}
                </span>
                <div className="flex gap-2 items-center opacity-40 group-hover:opacity-100 transition-all">
                  {isLoggedIn && (
                    <button
                      onClick={() => handleTogglePin(id, !note.pinned)}
                      className={`text-[12px] p-1 rounded hover:bg-blue-50 transition-colors ${note.pinned ? 'text-blue-600 scale-110' : 'text-gray-300 grayscale hover:grayscale-0'}`}
                      title={note.pinned ? "Unpin note" : "Pin note"}
                    >
                      📌
                    </button>
                  )}
                  {(isLoggedIn || !note.pinned) && (
                    <button
                      onClick={() => handleDelete(id)}
                      className="text-[10px] text-gray-300 hover:text-red-500 font-bold px-1 transition-colors"
                      title="Delete note"
                    >
                      (delete)
                    </button>
                  )}
                </div>
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
