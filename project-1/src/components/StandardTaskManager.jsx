import React, { useState } from 'react';
import { CheckSquare, Sparkles, Plus, Trash2, Calendar, AlertCircle, CheckCircle2, Clock, Filter, Loader2 } from 'lucide-react';

export default function StandardTaskManager({
  tasks = [],
  onSaveTask,
  onDeleteTask,
  isDark = false,
  isGuest = false,
  onRequireAuth,
}) {
  const [taskInput, setTaskInput] = useState('');
  const [priority, setPriority] = useState('Medium'); // 'High' | 'Medium' | 'Low'
  const [category, setCategory] = useState('Study Sprint');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'high'
  const [completedTasks, setCompletedTasks] = useState({});
  const [aiPlan, setAiPlan] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);

  const handleAddTask = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (!taskInput.trim()) return;

    const formattedTask = `[${priority} Priority] ${taskInput.trim()}${category ? ` #${category}` : ''}${
      dueDate ? ` (Due: ${dueDate})` : ''
    }`;

    if (onSaveTask) {
      onSaveTask(formattedTask);
    }

    setTaskInput('');
    setDueDate('');
  };

  const toggleTaskCompletion = (index) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Generate AI Prioritization & Task Breakdown via RAG
  const handleGenerateAiTaskPlan = async () => {
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (tasks.length === 0) {
      setAiPlan('Please add at least one task first to generate an AI study plan.');
      return;
    }

    setIsPlanning(true);
    setAiPlan('');

    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `As an expert academic productivity coach, prioritize and sequence these study tasks into an actionable 3-phase execution roadmap:\n\n${tasks.join('\n')}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiPlan(data.rag_answer || 'Plan generated.');
      } else {
        setAiPlan('1. High Priority: Tackle immediate assignment/exam tasks first.\n2. Medium: Review theory and formulas.\n3. Low: Practice bonus exercises.');
      }
    } catch (err) {
      setAiPlan('AI Strategy: Tackle high-difficulty concepts during peak morning focus, follow with timed practice problems.');
    } finally {
      setIsPlanning(false);
    }
  };

  // Compute Task Stats
  const totalTasks = tasks.length;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Filter Tasks
  const filteredTasks = tasks
    .map((task, originalIndex) => ({ task, originalIndex }))
    .filter(({ task, originalIndex }) => {
      const isCompleted = !!completedTasks[originalIndex];
      if (filter === 'pending') return !isCompleted;
      if (filter === 'completed') return isCompleted;
      if (filter === 'high') return task.includes('[High Priority]');
      return true;
    });

  return (
    <div className={`p-4 rounded-3xl border shadow-sm transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header & AI Plan Action */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div className="d-flex align-items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <CheckSquare size={22} />
          </div>
          <div>
            <h4 className="fw-bold mb-0">Task Manager</h4>
            <p className="small text-muted mb-0">Prioritize, sequence, and complete your academic milestones</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateAiTaskPlan}
          disabled={isPlanning || tasks.length === 0}
          className="btn btn-sm btn-primary rounded-pill px-3.5 fw-semibold d-flex align-items-center gap-2 shadow-sm"
        >
          {isPlanning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          <span>{isPlanning ? 'Analyzing Tasks...' : '✨ AI Prioritize & Breakdown'}</span>
        </button>
      </div>

      {/* Progress Bar & Counters */}
      <div className={`p-3 rounded-2xl border mb-4 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="d-flex justify-content-between align-items-center small fw-semibold mb-1.5">
          <span>Overall Progress: {completedCount} of {totalTasks} Tasks Completed</span>
          <span className="text-primary">{progressPercent}%</span>
        </div>
        <div className="progress" style={{ height: '8px', borderRadius: '999px' }}>
          <div
            className="progress-bar bg-success progress-bar-striped progress-bar-animated"
            role="progressbar"
            style={{ width: `${progressPercent}%` }}
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
      </div>

      {/* AI Task Plan Display */}
      {aiPlan && (
        <div className={`p-3.5 rounded-2xl border mb-4 shadow-sm ${
          isDark ? 'bg-slate-800/80 border-primary/30 text-slate-100' : 'bg-blue-50/80 border-blue-200 text-slate-800'
        }`}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="d-flex align-items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <strong className="small">AI Roadmap & Optimal Task Sequence</strong>
            </div>
            <button
              type="button"
              className="btn-close btn-close-sm"
              onClick={() => setAiPlan('')}
              aria-label="Close"
            />
          </div>
          <p className="small mb-0 text-break" style={{ whiteSpace: 'pre-line' }}>{aiPlan}</p>
        </div>
      )}

      {/* Quick Add Task Form */}
      <form onSubmit={handleAddTask} className="mb-4">
        <div className="row g-2 mb-2">
          <div className="col-12 col-md-5">
            <input
              type="text"
              placeholder="What need to be done? (e.g. Solve DBMS Relational Algebra Practice Set)..."
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : ''}`}
            />
          </div>

          <div className="col-6 col-md-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`form-select ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
            >
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`form-select ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
            >
              <option value="Exam Prep">Exam Prep</option>
              <option value="Assignment">Assignment</option>
              <option value="Reading">Reading</option>
              <option value="Lab Work">Lab Work</option>
            </select>
          </div>

          <div className="col-8 col-md-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
            />
          </div>

          <div className="col-4 col-md-1 d-flex">
            <button
              type="submit"
              disabled={!taskInput.trim()}
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center shadow-sm"
              title="Add Task"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3 pb-2 border-bottom overflow-auto">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`btn btn-sm rounded-pill px-3 ${
            filter === 'all' ? 'btn-dark' : isDark ? 'btn-outline-secondary' : 'btn-light'
          }`}
        >
          All ({totalTasks})
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`btn btn-sm rounded-pill px-3 ${
            filter === 'pending' ? 'btn-dark' : isDark ? 'btn-outline-secondary' : 'btn-light'
          }`}
        >
          Pending ({totalTasks - completedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`btn btn-sm rounded-pill px-3 ${
            filter === 'completed' ? 'btn-dark' : isDark ? 'btn-outline-secondary' : 'btn-light'
          }`}
        >
          Completed ({completedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('high')}
          className={`btn btn-sm rounded-pill px-3 ${
            filter === 'high' ? 'btn-dark' : isDark ? 'btn-outline-secondary' : 'btn-light'
          }`}
        >
          High Priority
        </button>
      </div>

      {/* Task List */}
      <div className="task-items d-flex flex-column gap-2">
        {filteredTasks.length === 0 ? (
          <div className={`text-center py-5 rounded-2xl border border-dashed ${
            isDark ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
          }`}>
            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
            <p className="small mb-0">No tasks in this filter. Keep up the high productivity!</p>
          </div>
        ) : (
          filteredTasks.map(({ task, originalIndex }) => {
            const isCompleted = !!completedTasks[originalIndex];
            const isHigh = task.includes('[High Priority]');
            const isMedium = task.includes('[Medium Priority]');

            return (
              <div
                key={originalIndex}
                className={`p-3 rounded-2xl border shadow-sm d-flex justify-content-between align-items-center gap-3 transition-all ${
                  isCompleted
                    ? isDark
                      ? 'bg-slate-900/60 border-slate-800 opacity-60'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                    : isDark
                    ? 'bg-slate-800/80 border-slate-700/80 text-slate-100'
                    : 'bg-slate-50/80 border-slate-200 text-slate-900'
                }`}
              >
                <div className="d-flex align-items-center gap-3 flex-grow-1">
                  <input
                    type="checkbox"
                    className="form-check-input mt-0 cursor-pointer"
                    style={{ width: '20px', height: '20px' }}
                    checked={isCompleted}
                    onChange={() => toggleTaskCompletion(originalIndex)}
                  />

                  <div className="d-flex flex-column">
                    <span className={`small fw-medium text-break ${isCompleted ? 'text-decoration-line-through text-muted' : ''}`}>
                      {task}
                    </span>
                    <div className="d-flex gap-2 mt-1">
                      {isHigh && (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill" style={{ fontSize: '0.7rem' }}>
                          High Priority
                        </span>
                      )}
                      {isMedium && (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill" style={{ fontSize: '0.7rem' }}>
                          Medium
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteTask && onDeleteTask(originalIndex)}
                  className="btn btn-sm p-1.5 border-0 rounded-circle text-danger hover:bg-danger/10"
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
