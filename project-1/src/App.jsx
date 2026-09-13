import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Sun, Moon } from 'lucide-react';
import Header from './components/header';
import Footer from './components/footer';
import Carsoul from './components/carsoul';
import Note from './components/note';
import Taskbar from './components/taskbar';
import Report from './components/report';
import ChatDrawer from './components/ChatDrawer';
import './App.css';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Theme Mode with localStorage persistence (Default: white / light)
  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('study_theme_mode') || 'light';
      }
    } catch (e) {
      // localStorage may be restricted in some environments
    }
    return 'light';
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('study_theme_mode', nextTheme);
      }
    } catch (e) {}
  };

  // Note Handlers
  const handleSaveNote = (newNote) => {
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const handleDeleteNote = (indexToDelete) => {
    setNotes((prevNotes) => prevNotes.filter((_, index) => index !== indexToDelete));
  };

  // Handler to update edited notes
  const handleEditNote = (indexToEdit, updatedText) => {
    setNotes((prevNotes) =>
      prevNotes.map((note, index) => (index === indexToEdit ? updatedText : note))
    );
  };

  // Task Handlers
  const handleSaveTask = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleDeleteTask = (indexToDelete) => {
    setTasks((prevTasks) => prevTasks.filter((_, index) => index !== indexToDelete));
  };

  return (
    <div
      className={`App d-flex flex-column min-vh-100 transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-dark'
      }`}
    >
      {/* Top Navbar with Theme Switcher */}
      <div className={`d-flex justify-content-between align-items-center px-4 py-2 border-bottom ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-light border-slate-200'
      }`}>
        <Header title="AI Study Assistant" />
        <button
          type="button"
          onClick={toggleTheme}
          className={`btn btn-sm rounded-pill d-flex align-items-center gap-2 px-3 shadow-sm border ${
            isDark ? 'btn-dark border-slate-700 text-warning' : 'btn-white border-slate-300 text-dark'
          }`}
          title={`Switch to ${isDark ? 'Light (White)' : 'Dark'} Mode`}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span className="small fw-semibold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Carousel Container */}
      <div className="position-relative z-0 lg:h-96 overflow-hidden">
        <Carsoul />
      </div>

      {/* Main Content */}
      <main className="container my-4 flex-grow-1 position-relative z-3 d-flex flex-column justify-content-center align-items-center w-100">
        <h1 className="text-center fw-bold">AI Multi-Modal Study & Task Platform</h1>
        <p className="text-center text-muted max-w-xl">
          Capture study tasks, log strategy notes, upload handwritten lecture PDFs, and generate interactive flowcharts, flashcards, and calendar timelines.
        </p>

        {/* Input Form Component */}
        <div className="note flex justify-content-center align-items-center w-full my-3">
          <Note onSaveNote={handleSaveNote} onSaveTask={handleSaveTask} />
        </div>

        {/* Unified Display Component */}
        <div className="taskbar flex justify-content-center align-items-center w-full">
          <Taskbar
            notes={notes}
            tasks={tasks}
            onDeleteNote={handleDeleteNote}
            onDeleteTask={handleDeleteTask}
            onEditNote={handleEditNote}
          />
        </div>

        {/* Report Component with Multi-Modal Features */}
        <div className="w-100 mt-4">
          <Report tasks={tasks} notes={notes} isDark={isDark} />
        </div>
      </main>

      {/* Global Document Chat Drawer */}
      <ChatDrawer isDark={isDark} />

      <Footer />
    </div>
  );
}