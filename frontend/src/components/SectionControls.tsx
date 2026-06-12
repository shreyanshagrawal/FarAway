import React, { useState } from 'react';
import { Check, Edit2, RotateCcw, X } from 'lucide-react';

interface SectionControlsProps {
  runId: string | null;
  section: string;
  onEdit?: () => void;
  showEdit?: boolean;
  approved?: boolean;
  onApprove?: () => void;
  readOnly?: boolean;
}

export function SectionControls({ runId, section, onEdit, showEdit, approved = false, onApprove, readOnly = false }: SectionControlsProps) {
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [note, setNote] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!runId) return;
    setRegenerating(true);
    try {
      await fetch(`/api/run/${runId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, note })
      });
      setShowRegenerate(false);
      setNote('');
    } catch (e) {
      console.error("Failed to regenerate", e);
    } finally {
      setRegenerating(false);
    }
  };

  if (readOnly) return null;

  return (
    <div className="flex items-center space-x-3 mb-4 justify-end">
      {showRegenerate ? (
        <div className="flex items-center space-x-2 bg-gray-800 p-1.5 rounded-md border border-gray-700">
          <input 
            type="text" 
            placeholder="Add a note (optional)..." 
            value={note}
            onChange={e => setNote(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-xs px-2 py-1 rounded text-white focus:outline-none focus:border-purple-500 w-48"
          />
          <button 
            onClick={handleRegenerate}
            disabled={regenerating}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {regenerating ? 'Wait...' : 'Re-run'}
          </button>
          <button onClick={() => setShowRegenerate(false)} className="text-gray-400 hover:text-gray-200 px-1">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <button 
            onClick={onApprove}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs transition-colors border ${
              approved 
                ? 'bg-green-900/40 text-green-400 border-green-800' 
                : 'bg-[#1A1A1D] text-gray-400 border-gray-800 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Check size={14} />
            <span>{approved ? 'Approved' : 'Approve'}</span>
          </button>

          {showEdit && (
            <button 
              onClick={onEdit}
              className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs bg-[#1A1A1D] text-gray-400 border border-gray-800 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>
          )}

          <button 
            onClick={() => setShowRegenerate(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs bg-[#1A1A1D] text-gray-400 border border-gray-800 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Regenerate</span>
          </button>
        </>
      )}
    </div>
  );
}
