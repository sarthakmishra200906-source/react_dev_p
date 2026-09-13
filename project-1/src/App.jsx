import React, { useState } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Header from './components/header';
import Footer from './components/footer';
import Carsoul from './components/carsoul';
import Note from './components/note';
import Taskbar from './components/taskbar';
import Report from './components/report';
import './App.css';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Note Handlers
  const handleSaveNote = (newNote) => {
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const handleDeleteNote = (indexToDelete) => {
    setNotes((prevNotes) => prevNotes.filter((_, index) => index !== indexToDelete));
  };

  // Added handler to update edited notes
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
    <div className="App bg-white text-dark d-flex flex-column min-vh-100">
      <Header title="My App" />
      
      {/* Carousel Container */}
      <div className="position-relative z-0 lg:h-96 overflow-hidden">
        <Carsoul />
      </div>

      {/* Main Content */}
      <main className="container my-4 flex-grow-1 position-relative z-3 d-flex flex-column justify-content-center align-items-center w-100">
        <h1 className="text-center">Welcome to My App</h1>
        <p className="text-center">
          This app will help to save text notes, convert text to uppercase/lowercase, and get a word summary.
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
        {/* Report Component */}
        <div className="w-100 mt-4">
          <Report tasks={tasks} notes={notes} />
        </div>
      </main>

      <Footer />
    </div>
  );
}