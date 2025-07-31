import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState('loading...');

  useEffect(() => {
    // Fetch the health status from the backend API
    fetch('http://127.0.0.1:8000/health')
      .then(response => response.json())
      .then(data => {
        // Assuming the data format is { status: 'ok' }
        setBackendStatus(data.status);
      })
      .catch(() => {
        setBackendStatus('error');
      });
  }, []); // The empty array means this effect runs once on mount

  return (
    <>
      <h1>Question Paper Solver</h1>
      <h2>Backend Status: {backendStatus}</h2>
    </>
  );
}

export default App;