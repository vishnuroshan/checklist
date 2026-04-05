import { useState } from "react";
import { dbClient } from "@/lib/db";
import type { ChecklistItem } from "@/core/db";
import { useAuth } from "@/hooks/useAuth";

interface ItemProps {
  uid?: string;
  checklistId: string;
  itemId: string;
  item: ChecklistItem;
  checked: boolean;
  disabled?: boolean;
}

export default function Item({
  uid,
  checklistId,
  itemId,
  item,
  checked,
  disabled,
}: ItemProps) {
  const { isLoggedIn } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);

  const handleToggle = () => {
    if (disabled || !uid) return;
    dbClient.toggleItem(uid, checklistId, itemId, !checked);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Delete this item?")) {
      dbClient.deleteItem(checklistId, itemId);
    }
  };

  const handleUpdate = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== item.text) {
      dbClient.updateItem(checklistId, itemId, trimmed);
    } else {
      setEditText(item.text);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleUpdate();
    if (e.key === "Escape") {
      setEditText(item.text);
      setIsEditing(false);
    }
  };

  return (
    <li className="py-2 group/item">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
          <input
            type="checkbox"
            className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            checked={checked}
            onChange={handleToggle}
            disabled={disabled}
          />
          {isEditing && isLoggedIn ? (
            <input
              type="text"
              autoFocus
              className="flex-1 text-sm border-b border-blue-500 outline-none bg-transparent py-0 px-0"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleUpdate}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <span
              onClick={() => isLoggedIn && setIsEditing(true)}
              className={`text-sm truncate transition-colors ${
                checked ? "line-through text-gray-400" : "text-gray-700"
              } ${isLoggedIn ? "hover:text-blue-600" : ""}`}
            >
              {item.text}
            </span>
          )}
        </label>
        
        {isLoggedIn && (
          <button
            onClick={handleDelete}
            className="text-[10px] text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity font-medium flex-shrink-0"
          >
            (delete)
          </button>
        )}
      </div>
    </li>
  );
}
