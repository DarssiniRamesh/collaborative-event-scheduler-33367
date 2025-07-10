import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

export { WebSocketProvider } from "./components/WebSocketProvider";
export { default as NotificationBanner } from "./components/NotificationBanner";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
