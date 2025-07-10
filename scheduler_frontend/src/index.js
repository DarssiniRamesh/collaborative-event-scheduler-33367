import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Export WebSocketProvider for possible test/demo entry
export { WebSocketProvider } from "./components/WebSocketProvider";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
