import React, { useState } from 'react';

export default function Note({ onSaveNote, onSaveTask }) {
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
    <div className="text bg-slate-50 w-2xl text-dark d-flex flex-row justify-content-center align-items-center p-4 rounded-2xl">
      {/* Task Form */}
      <form onSubmit={handleSaveTask} className="w-100">
        <div className="form-group">
          <h1 className="text-center">Enter your task</h1>
          <textarea 
            className="form-control" 
            id="taskText" 
            rows="4" 
            value={taskText} 
            onChange={handleChangeTask} 
            placeholder="Enter your text ..."
          />
        </div>
        
        <button 
          type="submit" 
          className="!bg-amber-200 !rounded-full mt-2 h-8 w-40 border-0 d-block mx-auto"
        >
          Save task
        </button>
      </form>

      {/* Note Form */}
      <form onSubmit={handleSaveNote} className="w-100 m-3">
        <div className="form-group">
          <h1 className="text-center">Enter your note</h1>
          <textarea 
            className="form-control" 
            id="noteText" 
            rows="4" 
            value={noteText} 
            onChange={handleChangeNote} 
            placeholder="Enter your text ..."
          />
        </div>
        
        <button 
          type="submit" 
          className="!bg-amber-200 !rounded-full mt-2 h-8 w-40 border-0 d-block mx-auto"
        >
          Save note
        </button>
      </form>
    </div>
  );
}