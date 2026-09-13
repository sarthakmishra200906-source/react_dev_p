    import React, { useState } from 'react';

export default function Taskbar({ 
  tasks = [], 
  notes = [], 
  onDeleteTask, 
  onDeleteNote, 
  onEditNote 
}) {
  // Track completed state for tasks
  const [completedTasks, setCompletedTasks] = useState({});

  // Track inline editing state for notes
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');

  // 1. Task Logic: Toggle checkbox with delayed delete
  const handleTaskToggle = (index) => {
    setCompletedTasks((prev) => ({ ...prev, [index]: !prev[index] }));
    setTimeout(() => {
      if (onDeleteTask) onDeleteTask(index);
    }, 400);
  };

  // 2. Note Logic: Start and save inline edits
  const handleStartEdit = (index, currentText) => {
    setEditingIndex(index);
    setEditText(currentText);
  };

  const handleSaveEdit = (index) => {
    if (editText.trim() && onEditNote) {
      onEditNote(index, editText);
    }
    setEditingIndex(null);
  };

  return (
    <div className="d-flex flex-column flex-md-row gap-4 w-100 justify-content-center align-items-start mt-4">
      
      {/* ================= TASKS SECTION ================= */}
      <div className="w-100 d-flex flex-column align-items-center gap-3">
        <h3 className="text-center fw-bold">Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-muted">No tasks added yet.</p>
        ) : (
          tasks.map((item, index) => (
            <div 
              key={index} 
              className="bg-slate-50 text-dark d-flex justify-content-between align-items-center p-3 rounded-2xl w-100 shadow-sm"
              style={{ maxWidth: '450px' }}
            >
              <p className={`mb-0 text-break me-3 ${completedTasks[index] ? 'text-decoration-line-through text-muted' : ''}`}>
                {item}
              </p>
              
              <div className="d-flex align-items-center gap-2">
                <input 
                  type="checkbox" 
                  className="form-check-input cursor-pointer" 
                  checked={!!completedTasks[index]}
                  onChange={() => handleTaskToggle(index)}
                />
                <span className="small text-muted">Done</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= NOTES SECTION ================= */}
      <div className="w-100 d-flex flex-column align-items-center gap-3">
        <h3 className="text-center fw-bold">Notes</h3>
        {notes.length === 0 ? (
          <p className="text-muted">No notes added yet.</p>
        ) : (
          notes.map((item, index) => (
            <div 
              key={index} 
              className="bg-slate-50 text-dark d-flex justify-content-between align-items-center p-3 rounded-2xl w-100 shadow-sm"
              style={{ maxWidth: '450px' }}
            >
              {editingIndex === index ? (
                <div className="d-flex w-100 me-2 gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm"
                    value={editText} 
                    onChange={(e) => setEditText(e.target.value)} 
                  />
                  <button 
                    type="button"
                    className="btn btn-sm btn-success rounded-pill px-3" 
                    onClick={() => handleSaveEdit(index)}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="mb-0 text-break me-3">{item}</p>
              )}

              {editingIndex !== index && (
                <div className="d-flex align-items-center gap-2">
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-secondary border-0" 
                    onClick={() => handleStartEdit(index, item)}
                  >
                     Edit
                  </button>
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-danger border-0" 
                    onClick={() => onDeleteNote && onDeleteNote(index)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}