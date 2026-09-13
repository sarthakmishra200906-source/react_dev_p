import React, { useState } from 'react';

export default function Note({ onSaveNote, onSaveTask, isDark = false }) {
  // 1. Separate state variables for each box
  const [taskText, setTaskText] = useState('');
  const [noteText, setNoteText] = useState('');

  // 2. Separate change handlers
  const handleChangeTask = (e) => {
    setTaskText(e.target.value);
  };
  
  const handleChangeNote = (e) => {
    setNoteText(e.target.value);
  };

  // 3. Separate save handlers
  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    if (onSaveTask) {
      onSaveTask(taskText);
    }

    setTaskText(''); // Clears ONLY the task box
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    if (onSaveNote) {
      onSaveNote(noteText);
    }

    setNoteText(''); // Clears ONLY the note box
  };

  return (
    <div
      className={`w-100 p-4 rounded-2xl border transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-lg'
          : 'bg-slate-50 border-slate-200 text-dark shadow-sm'
      } d-flex flex-column flex-md-row justify-content-center align-items-center gap-4`}
      style={{ maxWidth: '780px' }}
    >
      {/* Task Form */}
      <form onSubmit={handleSaveTask} className="w-100">
        <div className="form-group">
          <h4 className="text-center fw-bold mb-2">Enter your task</h4>
          <textarea 
            className={`form-control ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400'
                : 'bg-white border-slate-300 text-slate-900'
            }`} 
            id="taskText" 
            rows="4" 
            value={taskText} 
            onChange={handleChangeTask} 
            placeholder="e.g., Complete Chapter 4 Dynamic Programming exercises..."
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-warning fw-semibold rounded-pill mt-3 px-4 d-block mx-auto shadow-sm"
        >
          Save task
        </button>
      </form>

      {/* Note Form */}
      <form onSubmit={handleSaveNote} className="w-100">
        <div className="form-group">
          <h4 className="text-center fw-bold mb-2">Enter your note</h4>
          <textarea 
            className={`form-control ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400'
                : 'bg-white border-slate-300 text-slate-900'
            }`} 
            id="noteText" 
            rows="4" 
            value={noteText} 
            onChange={handleChangeNote} 
            placeholder="e.g., Exam on Friday, focus on memoization & DAG formulas..."
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-warning fw-semibold rounded-pill mt-3 px-4 d-block mx-auto shadow-sm"
        >
          Save note
        </button>
      </form>
    </div>
  );
}