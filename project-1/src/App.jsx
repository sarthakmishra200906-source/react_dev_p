import React from 'react';
import Header from './components/header';
import Footer from './components/footer';
import './App.css';

export default function App() {
  return (
    <>
      <Header title="My App" />
      <main className="container my-4">
        <h2>Welcome to My App</h2>
        <p>This is a simple React application using Vite, Bootstrap, and Tailwind CSS.</p>
        <p>Pasted the global hosted link on TV browser to see the application.</p>
        <p>checking re hosted website with working navbar from vs code manually</p>
        <p>Testing the application on different devices.</p>
      </main>
      <Footer />
    </>
  );
}

