import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, CheckCircle, Save, X } from 'lucide-react';
import { SectionControls } from './SectionControls';

interface SpecCardProps {
  specDocument: string;
  runId: string | null;
  setSpecDocument?: (doc: string) => void;
  approved?: boolean;
  onApprove?: () => void;
  readOnly?: boolean;
}

export function SpecCard({ specDocument, runId, setSpecDocument, approved, onApprove, readOnly }: SpecCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localSpec, setLocalSpec] = useState(specDocument);

  // Sync when prop changes and not editing
  React.useEffect(() => {
    if (!isEditing) setLocalSpec(specDocument);
  }, [specDocument, isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(specDocument);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col space-y-2">
      <SectionControls 
        runId={runId} 
        section="writer" 
        showEdit={!readOnly} 
        onEdit={() => setIsEditing(true)} 
        approved={approved}
        onApprove={onApprove}
        readOnly={readOnly}
      />
      
      {isEditing ? (
        <div className="bg-[#1A1A1D] border border-purple-500/50 rounded-lg overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-[#0F0F11]">
            <h3 className="text-sm font-semibold text-purple-400">Editing Specification</h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300"
              >
                <X size={14} /> <span>Cancel</span>
              </button>
              <button 
                onClick={() => {
                  if (setSpecDocument) setSpecDocument(localSpec);
                  setIsEditing(false);
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs text-white"
              >
                <Save size={14} /> <span>Save</span>
              </button>
            </div>
          </div>
          <textarea
            value={localSpec}
            onChange={e => setLocalSpec(e.target.value)}
            className="w-full h-[600px] bg-[#151518] text-gray-200 p-4 font-mono text-sm focus:outline-none resize-y"
          />
        </div>
      ) : (
        <div className="bg-[#1A1A1D] border border-gray-800 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-[#0F0F11]">
            <h3 className="text-sm font-semibold text-gray-300">Generated Specification</h3>
            <button 
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition-colors"
            >
              {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Raw'}</span>
            </button>
          </div>
          <div className="p-6 prose prose-invert prose-sm max-w-none prose-headings:text-gray-100 prose-a:text-purple-400">
            <ReactMarkdown>{localSpec}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
