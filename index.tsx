import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode can sometimes cause double-invocations which mess with 
  // complex Canvas/Video refs, but good for debugging. 
  // If performance issues arise with MediaPipe init, remove StrictMode.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
