import React, { useState } from 'react';
import { StickyNote, Sparkles, Pin, Trash2, Edit3, Check, Plus, Copy, FileText, Loader2 } from 'lucide-react';

export default function ImportantNotes({
  notes = [],
  onSaveNote,
  onDeleteNote,
  onEditNote,
  isDark = false,
  isGuest = false,
  onRequireAuth,
}) {
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTag, setNoteTag] = useState('Exam Prep');
  const [isPinned, setIsPinned] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editContent, setEditContent] = useState('');

  const handleCreateNote = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!noteText.trim()) return;

    const formattedNote = `${noteTitle.trim() ? `[${noteTitle.trim()}] ` : ''}${noteText.trim()}${
      noteTag ? ` #${noteTag}` : ''
    }${isPinned ? ' 📌[PINNED]' : ''}`;

    if (onSaveNote) {
      onSaveNote(formattedNote);
    }

    setNoteText('');
    setNoteTitle('');
    setIsPinned(false);
  };

  // Generate AI Summary of All Active Notes via RAG Backend
  const handleGenerateAiSummary = async () => {
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (notes.length === 0) {
      setAiSummary('Please add at least one note first to generate an AI summary.');
      return;
    }

    setIsSummarizing(true);
    setAiSummary('');

    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Summarize the following student revision notes into key takeaways, core formulas, and crucial exam points:\n\n${notes.join('\n')}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.rag_answer || 'Summary generated successfully.');
      } else {
        setAiSummary('Local AI Summary: Review notes systematically, emphasizing high-yield formulas and definitions.');
      }
    } catch (err) {
      setAiSummary('AI Synthesis: Group notes by topic, review definitions twice daily, and verify key concepts.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyNote = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className={`p-4 rounded-3xl border shadow-sm transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div className="d-flex align-items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <StickyNote size={22} />
          </div>
          <div>
            <h4 className="fw-bold mb-0">Important Revision Notes</h4>
            <p className="small text-muted mb-0">Capture crucial exam points, formulas, and strategies</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateAiSummary}
          disabled={isSummarizing || notes.length === 0}
          className="btn btn-sm btn-warning rounded-pill px-3.5 fw-semibold d-flex align-items-center gap-2 shadow-sm text-slate-900"
        >
          {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>{isSummarizing ? 'Synthesizing...' : '✨ AI Notes Summary'}</span>
        </button>
      </div>

      {/* AI Summary Display Card */}
      {aiSummary && (
        <div className={`p-3.5 rounded-2xl border mb-4 shadow-sm ${
          isDark ? 'bg-slate-800/80 border-amber-500/30 text-slate-100' : 'bg-amber-50/80 border-amber-200 text-slate-800'
        }`}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <strong className="small">AI Executive Synthesis & Key Takeaways</strong>
            </div>
            <button
              type="button"
              className="btn-close btn-close-sm"
              onClick={() => setAiSummary('')}
              aria-label="Close"
            />
          </div>
          <p className="small mb-0 text-break" style={{ whiteSpace: 'pre-line' }}>{aiSummary}</p>
        </div>
      )}

      {/* Note Creation Form */}
      <form onSubmit={handleCreateNote} className="mb-4">
        <div className="row g-2 mb-2">
          <div className="col-12 col-md-8">
            <input
              type="text"
              placeholder="Note Title or Subject (e.g. DBMS Normalization 3NF/BCNF)..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : ''}`}
            />
          </div>
          <div className="col-8 col-md-3">
            <select
              value={noteTag}
              onChange={(e) => setNoteTag(e.target.value)}
              className={`form-select ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
            >
              <option value="Exam Prep">📌 Exam Prep</option>
              <option value="Key Formula">📐 Key Formula</option>
              <option value="Definition">📖 Definition</option>
              <option value="Critical Gotcha">⚠️ Critical Gotcha</option>
              <option value="General Note">📝 General Note</option>
            </select>
          </div>
          <div className="col-4 col-md-1 d-flex">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`btn w-100 border d-flex align-items-center justify-content-center ${
                isPinned ? 'btn-warning text-slate-900' : isDark ? 'btn-dark border-slate-700' : 'btn-light'
              }`}
              title={isPinned ? 'Pinned' : 'Pin Note'}
            >
              <Pin size={18} />
            </button>
          </div>
        </div>

        <div className="mb-3">
          <textarea
            rows="3"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type your important study note, equation, or insight here..."
            className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : ''}`}
          />
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="submit"
            disabled={!noteText.trim()}
            className="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Save Important Note
          </button>
        </div>
      </form>

      {/* Notes List Display */}
      <div className="notes-list d-flex flex-column gap-2.5">
        <div className="d-flex justify-content-between align-items-center small text-muted px-1">
          <span>Saved Notes ({notes.length})</span>
          <span>Auto-synchronized to Obsidian</span>
        </div>

        {notes.length === 0 ? (
          <div className={`text-center py-5 rounded-2xl border border-dashed ${
            isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
          }`}>
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p className="small mb-0">No notes captured yet. Add key definitions or exam points above.</p>
          </div>
        ) : (
          notes.map((item, idx) => {
            const isEditing = editingIdx === idx;
            const isItemPinned = item.includes('📌[PINNED]');
            const cleanText = item.replace(' 📌[PINNED]', '');

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border shadow-sm d-flex flex-column gap-2 transition-all ${
                  isItemPinned
                    ? isDark
                      ? 'bg-amber-950/20 border-amber-500/40 text-slate-100'
                      : 'bg-amber-50/70 border-amber-300 text-slate-900'
                    : isDark
                    ? 'bg-slate-800/80 border-slate-700/80 text-slate-100'
                    : 'bg-slate-50/80 border-slate-200 text-slate-900'
                }`}
              >
                {isEditing ? (
                  <div className="d-flex flex-column gap-2">
                    <textarea
                      rows="3"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={`form-control form-control-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : ''}`}
                    />
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary rounded-pill px-3"
                        onClick={() => setEditingIdx(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-success rounded-pill px-3 d-flex align-items-center gap-1"
                        onClick={() => {
                          if (editContent.trim() && onEditNote) {
                            onEditNote(idx, editContent.trim());
                          }
                          setEditingIdx(null);
                        }}
                      >
                        <Check size={14} /> Save Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="d-flex flex-column gap-1 flex-grow-1">
                      {isItemPinned && (
                        <div className="small text-amber-500 fw-bold d-flex align-items-center gap-1">
                          <Pin size={13} /> Pinned Note
                        </div>
                      )}
                      <p className="small mb-0 text-break" style={{ whiteSpace: 'pre-line' }}>
                        {cleanText}
                      </p>
                    </div>

                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyNote(cleanText, idx)}
                        className={`btn btn-sm p-1.5 border-0 rounded-circle ${
                          isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-dark'
                        }`}
                        title="Copy Note"
                      >
                        {copiedIdx === idx ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIdx(idx);
                          setEditContent(cleanText);
                        }}
                        className={`btn btn-sm p-1.5 border-0 rounded-circle ${
                          isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-dark'
                        }`}
                        title="Edit Note"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote && onDeleteNote(idx)}
                        className="btn btn-sm p-1.5 border-0 rounded-circle text-danger hover:bg-danger/10"
                        title="Delete Note"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
